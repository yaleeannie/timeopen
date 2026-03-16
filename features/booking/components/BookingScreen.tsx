"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ServicePicker from "./ServicePicker";
import DateChips from "./DateChips";
import TimePicker from "./TimePicker";
import BookingCta from "./BookingCta";

import { MOCK_SERVICES } from "@/features/booking/mock";
import { buildDailySchedule } from "@/features/availability/buildDailySchedule";
import { fetchExceptionForDate } from "@/features/availability/fetchExceptionForDate";
import { computeAvailableStartTimes } from "@/features/availability/computeAvailableStartTimes";
import type { WeeklySchedule } from "@/features/availability/weeklySchedule";

import { fetchBusyFromDb } from "@/features/availability/fetchBusyFromDb";
import { saveReservation } from "@/features/booking/saveReservation";
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

  const [orgLocation, setOrgLocation] = useState<string>("");
  const [orgNotice, setOrgNotice] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  // ✅ Day 1 추가
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const lastStableSelectionRef = useRef<{ dateISO: string | null; serviceId: string | null; time: string | null }>({
    dateISO: null,
    serviceId: null,
    time: null,
  });

  const service = useMemo(
    () => MOCK_SERVICES.find((s) => s.id === serviceId) ?? null,
    [serviceId]
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
      setOrganizationId(org?.id ?? null);
      setOrgLocation((org?.location_text ?? "").trim());
      setOrgNotice((org?.notice_text ?? "").trim());
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

    const nextService = MOCK_SERVICES.find((s) => s.id === nextServiceId) ?? null;
    if (!nextService) return;

    const myReq = ++reqIdRef.current;
    const key = `${organizationId}_${nextDateISO}_${nextServiceId}`;

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
      durationMin: nextService.durationMin,
      bufferMin: nextService.bufferMin,
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
  }

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

    if (!availableTimes.includes(time)) {
      setMsg("선택한 시간은 현재 예약할 수 없어요. 다시 선택해 주세요.");
      return;
    }

    const end = minToHhmm(hhmmToMin(time) + service.durationMin);

    let rid: string | null = null;

    try {
      const result = await saveReservation({
        handle,
        serviceId: service.id,
        dateISO,
        start: time,
        end,
        durationMin: service.durationMin,
        bufferMin: service.bufferMin,
        customerName,
        customerPhone,
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
    <div className="space-y-8">
      <ServicePicker
        services={MOCK_SERVICES}
        value={serviceId}
        onChange={(next) => {
          userPickedTimeRef.current = false;
          setTime(null);
          setServiceId(next);
          void recomputeTimes(dateISO, next);
        }}
      />

      <div className="space-y-4">
        <DateChips
          value={dateISO}
          onChange={(next) => {
            userPickedTimeRef.current = false;
            setTime(null);
            setDateISO(next);
            void recomputeTimes(next, serviceId);
          }}
        />

        <div className="space-y-3">
          <div style={{ height: hintSlotHeight, display: "flex", alignItems: "center" }}>
            <div
              className="text-xs"
              style={{
                color: "#666",
                opacity: shouldShowEarliestHint ? 1 : 0,
                transition: "opacity 160ms ease",
                pointerEvents: "none",
              }}
            >
              현재 예약 가능한 가장 빠른 시간이에요!
            </div>
          </div>

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
        </div>

        {/* ✅ Day 1 추가: 고객 정보 입력 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>이름</div>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="이름"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #d0d0d0",
              background: "#fff",
              color: "#111",
              outline: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>전화번호</div>
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="전화번호"
            inputMode="tel"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #d0d0d0",
              background: "#fff",
              color: "#111",
              outline: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          />
        </div>

        {noTimesForCurrent && (
          <div className="text-sm" style={{ color: "#666" }}>
            선택한 날짜에는 가능한 시간이 없어요.
          </div>
        )}

        {msg ? (
          <div className="text-sm" style={{ color: "#b00020", fontWeight: 700 }}>
            {msg}
          </div>
        ) : null}
      </div>

      <BookingCta handle={handle} selection={ctaSelection} onReserve={onReserve} />

      {(orgLocation || orgNotice) ? (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee" }}>
          {orgLocation ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>📍 위치</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{orgLocation}</div>
            </div>
          ) : null}

          {orgNotice ? (
            <div>
              <div style={{ fontWeight: 800 }}>📢 예약 안내</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{orgNotice}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}