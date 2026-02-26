"use client";

import { useEffect, useMemo, useState } from "react";

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
import { cancelReservation } from "@/features/booking/cancelReservation";
import { fetchLatestConfirmedReservation } from "@/features/booking/fetchLatestConfirmedReservation";

import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";

type Props = {
  handle: string;
};

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

// 🔥 DB rows → WeeklySchedule 변환 함수 (null 안전)
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
    const weekdayNum = Number(row.weekday);
    if (!(weekdayNum >= 0 && weekdayNum <= 6)) continue;
    const weekday = weekdayNum as keyof WeeklySchedule;

    if (!row.is_open) {
      schedule[weekday] = { closed: true };
      continue;
    }

    const ws = toHHMM(row.work_start);
    const we = toHHMM(row.work_end);

    if (!ws || !we || !(ws < we)) {
      schedule[weekday] = { closed: true };
      continue;
    }

    const bs = toHHMM(row.break_start);
    const be = toHHMM(row.break_end);

    schedule[weekday] = {
      closed: false,
      workWindows: [{ start: ws, end: we }],
      breaks: bs && be && bs < be ? [{ start: bs, end: be }] : [],
    };
  }

  return schedule;
}

export default function BookingScreen({ handle }: Props) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgNotFound, setOrgNotFound] = useState(false);

  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);

  const [busy, setBusy] = useState<TimeRange[]>([]);
  const [isAutoRecommended, setIsAutoRecommended] = useState(false);

  // ✅ 조직 조회
  useEffect(() => {
    let cancelled = false;

    setOrgNotFound(false);
    setOrganizationId(null);
    setWeeklySchedule(null);

    (async () => {
      const org = await fetchOrganizationByHandle(handle);
      if (cancelled) return;

      if (!org) {
        setOrgNotFound(true);
        return;
      }

      setOrganizationId(org.id);
      console.log("BOOKING ORG ID:", org.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [handle]);

  // ✅ 서버 API 통해 availability 가져오기 → WeeklySchedule 세팅
  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    (async () => {
      const res = await fetch("/api/fetchAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (!res.ok) {
        console.error("fetchAvailability failed:", res.status);
        return;
      }

      const json = await res.json();
      if (!json?.data) {
        console.error("fetchAvailability: no data");
        return;
      }

      const weekly = convertRowsToWeeklySchedule(json.data);
      if (!cancelled) setWeeklySchedule(weekly);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // ✅ 기본 날짜 = 오늘 (로컬 기준)
  useEffect(() => {
    if (dateISO) return;

    const today = new Date();
    const localISO =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    setDateISO(localISO);
  }, [dateISO]);

  const service = useMemo(() => {
    if (!serviceId) return null;
    return MOCK_SERVICES.find((s) => s.id === serviceId) ?? null;
  }, [serviceId]);

  // ✅ exception rule for the selected date
const [exception, setException] = useState<any | null>(null);

useEffect(() => {
  if (!organizationId || !dateISO || !weeklySchedule) return;

  let cancelled = false;

  (async () => {
    const ex = await fetchExceptionForDate({ organizationId, dateISO });
    if (!cancelled) setException(ex);
  })();

  return () => {
    cancelled = true;
  };
}, [organizationId, dateISO]);

// ✅ dateISO + weeklySchedule + exception → dailySchedule
const dailySchedule = useMemo(() => {
  if (!dateISO || !weeklySchedule) return null;

  const [y, m, d] = dateISO.split("-").map(Number);
  const localDate = new Date(y, m - 1, d);

  return buildDailySchedule(localDate, weeklySchedule, exception);
}, [dateISO, weeklySchedule, exception]);


  // ✅ 날짜 바뀌면 busy 재조회
  useEffect(() => {
    if (!organizationId || !dateISO) return;

    let cancelled = false;

    (async () => {
      const rows = await fetchBusyFromDb({ organizationId, dateISO });
      if (!cancelled) setBusy(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, dateISO]);

  const availableTimes = useMemo(() => {
    if (!service || !dailySchedule) return [];

    return computeAvailableStartTimes({
      workWindows: dailySchedule.workWindows,
      breaks: dailySchedule.breaks,
      busy,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
      stepMin: 15,
    });
  }, [service, dailySchedule, busy]);

  // ✅ 서비스/날짜/가능시간 변경 시 첫 시간 자동 선택
  useEffect(() => {
    if (!serviceId || !dateISO || availableTimes.length === 0) {
      setTime(null);
      setIsAutoRecommended(false);
      return;
    }

    setTime(availableTimes[0]);
    setIsAutoRecommended(true);
  }, [dateISO, serviceId, availableTimes]);

  function onPickTime(t: string) {
    setTime(t);
    setIsAutoRecommended(false);
  }

  async function onReserve() {
    if (!organizationId || !service || !dateISO || !time) return;

    const start = time;
    const end = minToHhmm(hhmmToMin(time) + service.durationMin);

    await saveReservation({
      organizationId,
      serviceId: service.id,
      dateISO,
      start,
      end,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
    });

    const rows = await fetchBusyFromDb({ organizationId, dateISO });
    setBusy(rows);

    alert("예약 완료");
  }

  async function onCancelLatest() {
    if (!organizationId || !dateISO) return;

    const latest = await fetchLatestConfirmedReservation({
      organizationId,
      dateISO,
    });

    if (!latest?.id) {
      alert("취소할 예약 없음");
      return;
    }

    await cancelReservation(latest.id);

    const rows = await fetchBusyFromDb({ organizationId, dateISO });
    setBusy(rows);

    alert("최근 예약 취소 완료");
  }

  if (orgNotFound) return <div>존재하지 않는 페이지</div>;
  if (!organizationId) return <div>로딩중...</div>;
  if (!weeklySchedule) return <div>로딩중...</div>;

  return (
    <div className="space-y-8">
      <ServicePicker services={MOCK_SERVICES} value={serviceId} onChange={setServiceId} />

      <DateChips value={dateISO} onChange={setDateISO} />

      {isAutoRecommended && time && (
        <div className="text-sm text-neutral-500">현재 가장 빠른 예약 가능 시간이에요!</div>
      )}

      <TimePicker times={availableTimes} value={time} onChange={onPickTime} />

      <button onClick={onCancelLatest} className="border px-3 py-2 text-sm">
        (테스트) 최근 예약 취소
      </button>

      <BookingCta handle={handle} selection={{ serviceId, dateISO, time }} onReserve={onReserve} />
    </div>
  );
}