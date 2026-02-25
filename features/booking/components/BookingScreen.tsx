"use client";

import { useEffect, useMemo, useState } from "react";

import ServicePicker from "./ServicePicker";
import DateChips from "./DateChips";
import TimePicker from "./TimePicker";
import BookingCta from "./BookingCta";

import { MOCK_SERVICES } from "@/features/booking/mock";
import { buildDailySchedule } from "@/features/availability/buildDailySchedule";
import { computeAvailableStartTimes } from "@/features/availability/computeAvailableStartTimes";
import type { TimeRange } from "@/features/availability/weeklySchedule";
import { fetchBusyFromDb } from "@/features/availability/fetchBusyFromDb";
import { saveReservation } from "@/features/booking/saveReservation";
import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";

import { cancelReservation } from "@/features/booking/cancelReservation";
import { fetchLatestConfirmedReservation } from "@/features/booking/fetchLatestConfirmedReservation";

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

export default function BookingScreen({ handle }: Props) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgNotFound, setOrgNotFound] = useState(false);

  const [busy, setBusy] = useState<TimeRange[]>([]);
  const [isAutoRecommended, setIsAutoRecommended] = useState(false);

  // 조직 조회
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const org = await fetchOrganizationByHandle(handle);
      if (cancelled) return;

      if (!org) {
        setOrgNotFound(true);
        return;
      }

      setOrganizationId(org.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [handle]);

  // 기본 날짜 = 오늘
  useEffect(() => {
    if (dateISO) return;
    setDateISO(new Date().toISOString().slice(0, 10));
  }, [dateISO]);

  const service = useMemo(() => {
    if (!serviceId) return null;
    return MOCK_SERVICES.find((s) => s.id === serviceId) ?? null;
  }, [serviceId]);

  const dailySchedule = useMemo(() => {
    if (!dateISO) return null;
    return buildDailySchedule(new Date(dateISO));
  }, [dateISO]);

  // busy 조회
  useEffect(() => {
    if (!organizationId || !dateISO) return;

    (async () => {
      const rows = await fetchBusyFromDb({ organizationId, dateISO });
      setBusy(rows);
    })();
  }, [organizationId, dateISO]);

  // 가능한 시간 계산
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

  // 자동 추천 시간 세팅
  useEffect(() => {
    if (!serviceId || !dateISO) {
      setTime(null);
      setIsAutoRecommended(false);
      return;
    }

    if (availableTimes.length === 0) {
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

  // 예약 생성
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

  // 최근 예약 취소 (UI는 데이터 소스 모름)
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

  return (
    <div className="space-y-8">
      <ServicePicker
        services={MOCK_SERVICES}
        value={serviceId}
        onChange={setServiceId}
      />

      <DateChips value={dateISO} onChange={setDateISO} />

      {isAutoRecommended && time && (
        <div className="text-sm text-neutral-500">
          현재 가장 빠른 예약 가능 시간이에요!
        </div>
      )}

      <TimePicker times={availableTimes} value={time} onChange={onPickTime} />

      <button onClick={onCancelLatest} className="border px-3 py-2 text-sm">
        (테스트) 최근 예약 취소
      </button>

      <BookingCta
        handle={handle}
        selection={{ serviceId, dateISO, time }}
        onReserve={onReserve}
      />
    </div>
  );
}