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
  const [servicesLoading, setServicesLoading] = useState(true);
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
  const timesCacheRef = useRef<Map<string, string[]>>(new Map());

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

  const hasServices = services.length > 0;
  const showNoServices =
    !servicesLoading && organizationId != null && services.length === 0;

  const ctaSelection = useMemo(() => {
    if (isTimesReadyForCurrent) {
      lastStableSelectionRef.current = { dateISO, serviceId, time };
      return { dateISO, serviceId, time };
    }
    return lastStableSelectionRef.current;
  }, [isTimesReadyForCurrent, dateISO, serviceId, time]);

  useEffect(() => {
    let active = true;
    setServicesLoading(true);
    timesCacheRef.current.clear();
    computedKeyRef.current = null;
    reqIdRef.current += 1;

    void (async () => {
      try {
        const org = await fetchOrganizationByHandle(handle);
        if (!active) return;

        setOrganizationId(org?.id ?? null);
        setOrgLocation((org?.location_text ?? "").trim());
        setOrgNotice((org?.notice_text ?? "").trim());

        const rows = await fetchServicesByHandle(handle);
        if (!active) return;

        setServices(rows);
        if (rows.length > 0) {
          setServiceId((prev) => prev ?? rows[0].id);
        }
      } finally {
        if (active) setServicesLoading(false);
      }
    })();

    void fetch("/api/fetchAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      })
      .then((res) => res.json())
      .then((json) => {
        if (active) setWeeklySchedule(convertRowsToWeeklySchedule(json.data));
      });

    return () => {
      active = false;
      reqIdRef.current += 1;
    };
  }, [handle]);

  async function recomputeTimes(nextDateISO: string | null, nextServiceId: string | null) {
    if (!organizationId || !weeklySchedule) return;
    if (!nextDateISO || !nextServiceId) return;

    const nextService = services.find((s) => s.id === nextServiceId) ?? null;
    if (!nextService) return;

    const myReq = ++reqIdRef.current;
    const key = `${organizationId}_${nextDateISO}_${nextServiceId}`;
    const cached = timesCacheRef.current.get(key);

    if (cached) {
      setAvailableTimes(cached);
      computedKeyRef.current = key;
      setNoTimesForCurrent(cached.length === 0);
      setIsTimesLoading(false);

      const first = cached[0] ?? null;
      setTime(first);
      setShowEarliestHint(first != null);
      earliestHintKeyRef.current = first != null ? key : null;
      return;
    }

    setIsTimesLoading(true);
    setAvailableTimes([]);
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

      timesCacheRef.current.set(key, result);
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
      if (reqIdRef.current === myReq) setIsTimesLoading(false);
    }
  }

  useEffect(() => {
    if (!dateISO || !serviceId || !organizationId || !weeklySchedule) return;
    const key = `${organizationId}_${dateISO}_${serviceId}`;
    if (computedKeyRef.current === key) return;
    void recomputeTimes(dateISO, serviceId);
  }, [dateISO, serviceId, organizationId, weeklySchedule]);

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
      <section className="booking-services block h-auto min-h-[116px] overflow-visible rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm [&_button]:min-h-20 [&_button]:rounded-2xl [&_button]:border-[#dceef2] [&_button]:px-3.5 [&_button]:py-3.5">
        {servicesLoading ? (
          <div>
            <div className="text-sm font-semibold text-gray-900">서비스 선택</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl bg-[#eef6f8]" />
              ))}
            </div>
          </div>
        ) : showNoServices ? (
          <div>
            <div className="text-sm font-semibold text-gray-900">서비스 선택</div>
            <div className="mt-3 rounded-2xl border border-[#dceef2] bg-[#f8fcfd] px-4 py-5 text-sm font-medium text-gray-500">
              예약 가능한 서비스가 없어요.
            </div>
          </div>
        ) : hasServices ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">서비스 선택</div>
            <div className={services.length >= 4 ? "flex gap-3 overflow-x-auto pb-2" : "grid grid-cols-3 gap-3"}>
              {services.map((item) => {
                const active = item.id === serviceId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === serviceId) return;
                      reqIdRef.current += 1;
                      userPickedTimeRef.current = false;
                      computedKeyRef.current = null;
                      setTime(null);
                      setAvailableTimes([]);
                      setNoTimesForCurrent(false);
                      setIsTimesLoading(dateISO != null);
                      setServiceId(item.id);
                    }}
                    className={[
                      services.length >= 4 ? "min-w-[150px] shrink-0" : "w-full",
                      "min-h-20 rounded-2xl border px-3.5 py-3.5 text-left transition",
                      active
                        ? "border-[#28b9dc] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] text-white shadow-[0_8px_18px_rgba(40,185,220,0.2)]"
                        : "border-[#dceef2] bg-white text-gray-900 hover:border-[#a9dce7]",
                    ].join(" ")}
                  >
                    <div className="text-base font-semibold leading-tight">{item.name}</div>
                    <div className={`mt-2 text-[13px] ${active ? "text-cyan-50" : "text-gray-500"}`}>
                      {item.duration_min ? `${item.duration_min}분` : ""}
                      {item.price != null ? ` · ${item.price.toLocaleString()}원` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
        <div className="booking-date [&>div>div:nth-child(2)]:border-0 [&>div>div:nth-child(2)]:p-0">
          <DateChips
            value={dateISO}
            onChange={(next) => {
              if (next === dateISO) return;
              reqIdRef.current += 1;
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

          <div className="booking-times mt-3 [&_button]:min-h-10 [&_button]:rounded-xl [&_button]:border-[#dceef2] [&_button]:px-4 [&_button]:font-bold">
            {isTimesLoading ? (
              <div className="rounded-2xl border border-[#dceef2] bg-[#f8fcfd] px-4 py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#5594a3]">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#28b9dc]" />
                  가능한 시간을 불러오는 중
                </div>
                <div className="mt-3 flex gap-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-10 w-16 animate-pulse rounded-xl bg-[#e6f4f7]" />
                  ))}
                </div>
              </div>
            ) : noTimesForCurrent ? (
              <div className="rounded-2xl border border-[#dceef2] bg-[#f8fcfd] px-4 py-5 text-sm font-medium text-gray-500">
                선택한 날짜에는 예약 가능한 시간이 없어요.
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

      <style jsx global>{`
        .booking-date button[style*="background:#2F2F2F"],
        .booking-date button[style*="background: #2F2F2F"],
        .booking-date button[style*="background: rgb(47, 47, 47)"],
        .booking-times button[style*="background:#2F2F2F"],
        .booking-times button[style*="background: #2F2F2F"],
        .booking-times button[style*="background: rgb(47, 47, 47)"] {
          border-color: #28b9dc !important;
          background: linear-gradient(135deg, #5bd8f2, #24b8df) !important;
          color: #ffffff !important;
          box-shadow: 0 6px 14px rgba(40, 185, 220, 0.18);
        }
      `}</style>
    </div>
  );
}
