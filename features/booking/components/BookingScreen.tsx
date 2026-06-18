"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import DateChips from "./DateChips";
import TimePicker from "./TimePicker";
import BookingCta from "./BookingCta";

import { fetchServicesByHandle, type ServiceRow } from "@/features/services/fetchServicesByHandle";
import { buildDailySchedule } from "@/features/availability/buildDailySchedule";
import { fetchExceptionForDate } from "@/features/availability/fetchExceptionForDate";
import { computeAvailableStartTimes } from "@/features/availability/computeAvailableStartTimes";
import type { WeeklySchedule } from "@/features/availability/weeklySchedule";

import { fetchBusyFromDb } from "@/features/availability/fetchBusyFromDb";
import { saveReservation } from "@/features/booking/saveReservation";
import {
  normalizePhoneToE164,
  type SupportedPhoneCountry,
} from "@/features/booking/phone";
import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";

type Props = { handle: string };

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}
function minToHhmm(v: number) {
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
const toHHMM = (t: any) => (typeof t === "string" ? t.slice(0, 5) : "");

function convertRowsToWeeklySchedule(rows: any[]): WeeklySchedule {
  const schedule: WeeklySchedule = {
    0: { closed: true },
    1: { closed: true },
    2: { closed: true },
    3: { closed: true },
    4: { closed: true },
    5: { closed: true },
    6: { closed: true },
  };

  for (const row of rows ?? []) {
    const weekday = Number(row.weekday) as keyof WeeklySchedule;

    if (!row.is_open) {
      schedule[weekday] = { closed: true };
      continue;
    }

    schedule[weekday] = {
      closed: false,
      workWindows: [{ start: toHHMM(row.work_start), end: toHHMM(row.work_end) }],
      breaks:
        row.break_start && row.break_end
          ? [{ start: toHHMM(row.break_start), end: toHHMM(row.break_end) }]
          : [],
    };
  }

  return schedule;
}

function formatISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingScreen({ handle }: Props) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);

  const [dateISO, setDateISO] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const [showEarliestHint, setShowEarliestHint] = useState(false);
  const earliestHintKeyRef = useRef<string | null>(null);

  const userPickedTimeRef = useRef(false);
  const computedKeyRef = useRef<string | null>(null);
  const reqIdRef = useRef(0);

  const [noTimesForCurrent, setNoTimesForCurrent] = useState<boolean>(false);
  const [isTimesLoading, setIsTimesLoading] = useState(false);

  const [orgLocation, setOrgLocation] = useState<string>("");
  const [orgNotice, setOrgNotice] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  // ✅ Day 1 추가
  const [customerName, setCustomerName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<SupportedPhoneCountry>("KR");
  const [customerPhone, setCustomerPhone] = useState("");

  const lastStableSelectionRef = useRef<{ dateISO: string | null; serviceId: string | null; time: string | null }>({
    dateISO: null,
    serviceId: null,
    time: null,
  });

  const service = useMemo(
  () => services.find((s) => s.id === serviceId) ?? null,
  [services, serviceId]
  );

  const currentKey = useMemo(() => {
    if (!organizationId || !dateISO || !serviceId) return null;
    return `${organizationId}_${dateISO}_${serviceId}`;
  }, [organizationId, dateISO, serviceId]);

  const isTimesReadyForCurrent = currentKey != null && computedKeyRef.current === currentKey;

  const shouldShowEarliestHint =
    showEarliestHint &&
    currentKey != null &&
    earliestHintKeyRef.current === currentKey &&
    isTimesReadyForCurrent &&
    time != null &&
    availableTimes[0] === time;

  const ctaSelection = useMemo(() => {
    if (isTimesReadyForCurrent) {
      lastStableSelectionRef.current = { dateISO, serviceId, time };
      return { dateISO, serviceId, time };
    }
    return lastStableSelectionRef.current;
  }, [isTimesReadyForCurrent, dateISO, serviceId, time]);

  useEffect(() => {
  (async () => {
    const org = await fetchOrganizationByHandle(handle);
    setOrgLocation((org?.location_text ?? "").trim());
    setOrgNotice((org?.notice_text ?? "").trim());

    const rows = await fetchServicesByHandle(handle);
    setServices(rows);
    setOrganizationId(org?.id ?? rows[0]?.organization_id ?? null);

    if (rows.length > 0) {
      setServiceId((prev) => prev ?? rows[0].id);
    }
  })();
  }, [handle]);

  useEffect(() => {
    if (!organizationId) return;

    (async () => {
      const res = await fetch("/api/fetchAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      const json = await res.json();
      setWeeklySchedule(convertRowsToWeeklySchedule(json.data));
    })();
  }, [organizationId, handle]);

  async function recomputeTimes(nextDateISO: string | null, nextServiceId: string | null) {
    if (!organizationId || !weeklySchedule) return;
    if (!nextDateISO || !nextServiceId) return;

    const nextService = services.find((s) => s.id === nextServiceId) ?? null;
    if (!nextService) return;

    const myReq = ++reqIdRef.current;
    const key = `${organizationId}_${nextDateISO}_${nextServiceId}`;

    setIsTimesLoading(true);
    setNoTimesForCurrent(false);

    try {
      const [ex, busyRes] = await Promise.all([
        fetchExceptionForDate({ handle, dateISO: nextDateISO }),
        fetchBusyFromDb({ handle, dateISO: nextDateISO }),
      ]);

      if (reqIdRef.current !== myReq) return;

      const [y, m, d] = nextDateISO.split("-").map(Number);
      const daily = buildDailySchedule(new Date(y, m - 1, d), weeklySchedule, ex ?? null);

      const now = new Date();
      const todayISO = formatISODate(now);
      let notBefore: string | undefined = undefined;
      if (nextDateISO === todayISO) {
        notBefore = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      }

      const busy = busyRes?.busy ?? [];

      const result = computeAvailableStartTimes({
        workWindows: daily.workWindows,
        breaks: daily.breaks,
        busy,
        durationMin: nextService.duration_min,
        bufferMin: 0,
        stepMin: 15,
        notBefore,
      });

      if (reqIdRef.current !== myReq) return;

      setAvailableTimes(result);
      computedKeyRef.current = key;
      setNoTimesForCurrent(result.length === 0);

      const first = result[0] ?? null;

      if (!userPickedTimeRef.current) {
        setTime(first);
        setShowEarliestHint(first != null);
        earliestHintKeyRef.current = key;
      } else {
        const stillValid = time != null && result.includes(time);
        if (!stillValid) {
          userPickedTimeRef.current = false;
          setTime(first);
          setShowEarliestHint(first != null);
          earliestHintKeyRef.current = key;
        } else {
          setShowEarliestHint(false);
          earliestHintKeyRef.current = null;
        }
      }
    } finally {
      if (reqIdRef.current === myReq) {
        setIsTimesLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!organizationId || !weeklySchedule || !dateISO || !serviceId) return;

    const key = `${organizationId}_${dateISO}_${serviceId}`;
    if (computedKeyRef.current === key) return;

    void recomputeTimes(dateISO, serviceId);
  }, [organizationId, weeklySchedule, dateISO, serviceId, services]);

  async function onReserve() {
    setMsg("");

    if (!organizationId || !service || !dateISO || !serviceId || !time) return;
    if (!isTimesReadyForCurrent) return;

    // ✅ Day 1 추가: 이름/전화 검증
    if (!customerName.trim()) {
      setMsg("이름을 입력해주세요.");
      return;
    }

    if (!customerPhone.trim()) {
      setMsg("전화번호를 입력해주세요.");
      return;
    }

    const normalizedPhone = normalizePhoneToE164(phoneCountry, customerPhone);
    if (!normalizedPhone.ok) {
      setMsg("선택한 국가에 맞는 전화번호를 입력해주세요.");
      return;
    }

    if (!availableTimes.includes(time)) {
      setMsg("선택한 시간은 현재 예약할 수 없어요. 다시 선택해 주세요.");
      return;
    }

    const end = minToHhmm(hhmmToMin(time) + service.duration_min);

    let rid: string | null = null;

    try {
      const result = await saveReservation({
        handle,
        serviceId: service.id,
        dateISO,
        start: time,
        end,
        durationMin: service.duration_min,
        bufferMin: 0,
        customerName,
        customerPhone: normalizedPhone.e164,
      });

      if (typeof result === "string") rid = result;
      else rid = (result as any)?.id ?? (result as any)?.[0]?.id ?? null;
    } catch (e: any) {
      setMsg(e?.message ?? "예약 처리 중 오류가 발생했습니다.");
      return;
    }

    if (!rid) {
      setMsg("예약은 저장됐지만 reservation id를 찾을 수 없습니다.");
      return;
    }

    await fetch("/api/notify/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reservationId: rid }),
    }).catch(() => {});

    window.location.href = `/u/${handle}/confirmed?rid=${encodeURIComponent(String(rid))}`;
  }

  const hintSlotHeight = 18;

  return (
    <div className="space-y-3.5">
      <section className="h-auto overflow-visible rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-900">서비스 선택</div>

        {services.length > 0 ? (
          <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {services.map((item) => {
              const active = item.id === serviceId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    userPickedTimeRef.current = false;
                    computedKeyRef.current = null;
                    setTime(null);
                    setAvailableTimes([]);
                    setNoTimesForCurrent(false);
                    setIsTimesLoading(dateISO != null);
                    setServiceId(item.id);
                  }}
                  className={[
                    "min-h-[88px] w-full min-w-0 rounded-[18px] border px-4 py-4 text-left transition",
                    active
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-900 hover:border-gray-300",
                  ].join(" ")}
                >
                  <div className="text-base font-semibold leading-tight">{item.name}</div>
                  <div className={`mt-2 text-[13px] ${active ? "text-gray-200" : "text-gray-500"}`}>
                    {item.duration_min ? `${item.duration_min}분` : ""}
                    {item.price != null ? ` · ${item.price.toLocaleString()}원` : ""}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
        <div className="[&>div>div:nth-child(2)]:border-0 [&>div>div:nth-child(2)]:p-0">
          <DateChips
            value={dateISO}
            onChange={(next) => {
              userPickedTimeRef.current = false;
              computedKeyRef.current = null;
              setTime(null);
              setAvailableTimes([]);
              setNoTimesForCurrent(false);
              setIsTimesLoading(serviceId != null);
              setDateISO(next);
            }}
          />
        </div>

        <div className="border-t border-[#edf5f7] pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-gray-900">시간 선택</div>
            <div
              className="text-right text-[11px] font-bold"
              style={{
                color: "#28b9dc",
                opacity: shouldShowEarliestHint ? 1 : 0,
                transition: "opacity 160ms ease",
                pointerEvents: "none",
                minHeight: hintSlotHeight,
              }}
            >
              가장 빠른 시간
            </div>
          </div>

          <div className="mt-3 [&_button]:min-h-10 [&_button]:rounded-xl [&_button]:border-[#dceef2] [&_button]:px-4 [&_button]:font-bold">
            {!serviceId || !dateISO ? (
              <TimePicker
                times={[]}
                value={null}
                disabled
                onChange={() => {}}
              />
            ) : isTimesLoading || !organizationId || !weeklySchedule ? (
              <div className="rounded-2xl border border-[#dceef2] bg-[#f8fcfd] px-4 py-6 text-sm font-medium text-[#5594a3]">
                가능한 시간을 불러오는 중...
              </div>
            ) : noTimesForCurrent && isTimesReadyForCurrent ? (
              <div className="rounded-2xl border border-[#dceef2] bg-white px-4 py-6">
                <div className="text-sm font-semibold text-gray-900">가능한 시간이 없어요</div>
                <div className="mt-1 text-sm text-gray-600">연속 시간이 필요해요.</div>
                <div className="mt-3 text-sm text-gray-400">다른 날짜를 선택해주세요.</div>
              </div>
            ) : (
              <TimePicker
                times={availableTimes}
                value={time}
                onChange={(t) => {
                  if (!isTimesReadyForCurrent) return;

                  userPickedTimeRef.current = true;
                  setTime(t);

                  setShowEarliestHint(false);
                  earliestHintKeyRef.current = null;
                }}
              />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
        <div className="mb-4 text-base font-black">예약자 정보</div>
        {/* ✅ Day 1 추가: 고객 정보 입력 */}
        <div>
          <div className="mb-1.5 text-sm font-bold text-gray-700">이름</div>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="이름"
            className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
          />
        </div>

        <div>
          <div className="mb-1.5 text-sm font-bold text-gray-700">전화번호</div>
          <div className="flex items-stretch gap-2">
            <select
              value={phoneCountry}
              onChange={(e) => setPhoneCountry(e.target.value as SupportedPhoneCountry)}
              aria-label="전화번호 국가"
              className="min-h-11 w-[132px] min-w-0 shrink-0 rounded-xl border border-[#dceef2] bg-white px-2.5 py-2.5 text-sm outline-none focus:border-[#55d4f0]"
            >
              <option value="KR">대한민국 +82</option>
              <option value="JP">일본 +81</option>
              <option value="US">미국 +1</option>
              <option value="CA">캐나다 +1</option>
              <option value="TH">태국 +66</option>
              <option value="CN">중국 +86</option>
            </select>

            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="전화번호"
              inputMode="tel"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
            />
          </div>
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">
            {msg}
          </div>
        ) : null}
      </section>

      <BookingCta selection={ctaSelection} onReserve={onReserve} />

      {(orgLocation || orgNotice) ? (
        <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
          <div className="mb-4 text-base font-black">방문 안내</div>
          {orgLocation ? (
            <div className="mb-4">
              <div className="text-sm font-bold text-[#28b9dc]">위치</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">{orgLocation}</div>
            </div>
          ) : null}

          {orgNotice ? (
            <div>
              <div className="text-sm font-bold text-[#28b9dc]">예약 안내</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">{orgNotice}</div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
