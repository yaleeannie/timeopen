// features/booking/saveReservation.ts

import { supabase } from "@/lib/supabase/client";

type Params = {
  organizationId: string;
  serviceId: string;
  dateISO: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM" (start + duration)
  durationMin: number;
  bufferMin: number;
};

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export async function saveReservation(params: Params) {
  // ✅ 입력 방어
  if (params.durationMin <= 0) {
    throw new Error("예약 실패: durationMin은 0보다 커야 합니다.");
  }
  if (params.bufferMin < 0) {
    throw new Error("예약 실패: bufferMin은 0 이상이어야 합니다.");
  }

  const newStart = hhmmToMin(params.start);
  const newEndWithBuffer = hhmmToMin(params.end) + params.bufferMin;

  // ✅ 저장 직전, DB에서 다시 한 번 충돌 검사 (마지막 안전장치)
  const { data: existing, error: fetchErr } = await supabase
    .from("reservations")
    .select("start_time,end_time,buffer_min,status")
    .eq("organization_id", params.organizationId)
    .eq("date", params.dateISO)
    .eq("status", "confirmed");

  if (fetchErr) throw fetchErr;

  for (const r of existing ?? []) {
    const s = hhmmToMin(String(r.start_time).slice(0, 5));
    const e = hhmmToMin(String(r.end_time).slice(0, 5)) + (r.buffer_min ?? 0);

    if (overlaps(newStart, newEndWithBuffer, s, e)) {
      throw new Error("예약 충돌: 기존 예약과 시간이 겹칩니다.");
    }
  }

  const { error } = await supabase.from("reservations").insert({
    organization_id: params.organizationId,
    service_id: params.serviceId,
    date: params.dateISO,
    start_time: params.start,
    end_time: params.end,
    duration_min: params.durationMin,
    buffer_min: params.bufferMin,
    status: "confirmed",
  });

  if (error) throw error;
}