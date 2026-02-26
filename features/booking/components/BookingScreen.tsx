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

/* Weekly 변환 */
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

export default function BookingScreen({ handle }: Props) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);

  const [dateISO, setDateISO] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [busy, setBusy] = useState<TimeRange[] | null>(null);
  const [exception, setException] = useState<any | undefined>(undefined);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [hasComputed, setHasComputed] = useState(false);

  const readyKeyRef = useRef<string | null>(null);

  /* 기본 날짜 */
  useEffect(() => {
    if (dateISO) return;
    const d = new Date();
    setDateISO(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }, [dateISO]);

  /* org */
  useEffect(() => {
    (async () => {
      const org = await fetchOrganizationByHandle(handle);
      setOrganizationId(org?.id ?? null);
    })();
  }, [handle]);

  /* weekly */
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

  /* 날짜 변경시 완전 초기화 */
  useEffect(() => {
    setBusy(null);
    setException(undefined);
    setHasComputed(false);
    setTime(null);
  }, [organizationId, dateISO, serviceId]);

  /* exception */
  useEffect(() => {
    if (!organizationId || !dateISO) return;

    (async () => {
      const ex = await fetchExceptionForDate({ organizationId, dateISO });
      setException(ex ?? null);
    })();
  }, [organizationId, dateISO]);

  /* busy */
  useEffect(() => {
    if (!organizationId || !dateISO) return;

    (async () => {
      const rows = await fetchBusyFromDb({ organizationId, dateISO });
      setBusy(rows ?? []);
    })();
  }, [organizationId, dateISO]);

  const service = useMemo(
    () => MOCK_SERVICES.find((s) => s.id === serviceId) ?? null,
    [serviceId]
  );

  /* 🔥 compute는 busy + exception 둘 다 준비된 후 1회만 */
  useEffect(() => {
    if (!service || !weeklySchedule || !dateISO) return;
    if (busy === null) return;
    if (exception === undefined) return;

    const key = `${organizationId}_${dateISO}_${serviceId}`;

    if (readyKeyRef.current === key) return;

    const [y, m, d] = dateISO.split("-").map(Number);
    const daily = buildDailySchedule(
      new Date(y, m - 1, d),
      weeklySchedule,
      exception
    );

        const now = new Date();
    const todayISO =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let notBefore: string | undefined = undefined;

    // ✅ 선택된 날짜가 "오늘"이면 now 이후만 허용
    if (dateISO === todayISO) {
      notBefore =
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    const result = computeAvailableStartTimes({
      workWindows: daily.workWindows,
      breaks: daily.breaks,
      busy,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
      stepMin: 15,
      notBefore, // ✅ 추가
    });

    setAvailableTimes(result);
    setHasComputed(true);
    readyKeyRef.current = key;
  }, [service, weeklySchedule, dateISO, busy, exception, serviceId, organizationId]);

  async function onReserve() {
    if (!organizationId || !service || !dateISO || !time) return;

    const end = minToHhmm(hhmmToMin(time) + service.durationMin);

    await saveReservation({
      organizationId,
      serviceId: service.id,
      dateISO,
      start: time,
      end,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
    });

    setBusy(null);
    const rows = await fetchBusyFromDb({ organizationId, dateISO });
    setBusy(rows ?? []);
  }

  return (
    <div className="space-y-8">
      <ServicePicker services={MOCK_SERVICES} value={serviceId} onChange={setServiceId} />
      <DateChips value={dateISO} onChange={setDateISO} />
      <TimePicker times={availableTimes} value={time} onChange={setTime} />

      {hasComputed && service && availableTimes.length === 0 && (
        <div style={{ fontSize: 12, color: "#666" }}>가능한 시간이 없어요.</div>
      )}

      <BookingCta handle={handle} selection={{ serviceId, dateISO, time }} onReserve={onReserve} />
    </div>
  );
}