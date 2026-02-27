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
import type { TimeRange, WeeklySchedule } from "@/features/availability/weeklySchedule";

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

  // ✅ "현재 화면이 빈 상태(가능한 시간 없음)인지" 표시는
  // 최신 계산 결과가 반영될 때만 바뀌게끔 별도 상태로 들고 간다.
  const [noTimesForCurrent, setNoTimesForCurrent] = useState<boolean>(false);

  // ✅ CTA 깜빡임 방지용: 마지막으로 유효했던 selection을 유지한다.
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

  // ✅ CTA에 내려줄 selection은 "현재 계산이 완료된 경우에만" 갱신
  // (계산 중에는 마지막 안정 상태를 그대로 유지 → 버튼 깜빡임 제거)
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
    })();
  }, [handle]);

  useEffect(() => {
    if (!organizationId) return;

    (async () => {
      const res = await fetch("/api/fetchAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      const json = await res.json();
      setWeeklySchedule(convertRowsToWeeklySchedule(json.data));
    })();
  }, [organizationId]);

  async function recomputeTimes(nextDateISO: string | null, nextServiceId: string | null) {
    if (!organizationId || !weeklySchedule) return;
    if (!nextDateISO || !nextServiceId) return;

    const nextService = MOCK_SERVICES.find((s) => s.id === nextServiceId) ?? null;
    if (!nextService) return;

    const myReq = ++reqIdRef.current;
    const key = `${organizationId}_${nextDateISO}_${nextServiceId}`;

    const [ex, busy] = await Promise.all([
      fetchExceptionForDate({ organizationId, dateISO: nextDateISO }),
      fetchBusyFromDb({ organizationId, dateISO: nextDateISO }),
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

    const result = computeAvailableStartTimes({
      workWindows: daily.workWindows,
      breaks: daily.breaks,
      busy: busy ?? [],
      durationMin: nextService.durationMin,
      bufferMin: nextService.bufferMin,
      stepMin: 15,
      notBefore,
    });

    if (reqIdRef.current !== myReq) return;

    setAvailableTimes(result);
    computedKeyRef.current = key;

    // ✅ "가능한 시간이 없어요" 표시는 결과가 확정된 순간에만 갱신
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
    if (!organizationId || !service || !dateISO || !serviceId || !time) return;
    if (!isTimesReadyForCurrent) return;

    if (!availableTimes.includes(time)) {
      alert("선택한 시간은 현재 예약할 수 없어요. 다시 선택해 주세요.");
      return;
    }

    const end = minToHhmm(hhmmToMin(time) + service.durationMin);

    try {
      await saveReservation({
      handle,
      serviceId: service.id,
      dateISO,
      start: time,
      end,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
      name: "guest",      // ✅ 임시
      contact: "instagram", // ✅ 임시
      });
    } catch (e: any) {
      alert(e?.message ?? "예약 처리 중 오류가 발생했습니다.");
      return;
    }

    alert("예약이 완료되었습니다!");

    setTime(null);
    userPickedTimeRef.current = false;
    setShowEarliestHint(false);
    earliestHintKeyRef.current = null;

    await recomputeTimes(dateISO, serviceId);
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
          <div
            style={{
              height: hintSlotHeight,
              display: "flex",
              alignItems: "center",
            }}
          >
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
      </div>

      {/* ✅ 2) CTA 깜빡임 제거:
          selection을 계산 완료 시점에만 갱신 → 버튼이 0.1초 비활성화됐다가 켜지는 현상 방지 */}
      <BookingCta handle={handle} selection={ctaSelection} onReserve={onReserve} />
    </div>
  );
}