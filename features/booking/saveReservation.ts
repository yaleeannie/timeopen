// features/booking/saveReservation.ts
import { supabase } from "@/lib/supabase/client";

type Params = {
  // ✅ 더 이상 orgId 신뢰하지 않음. handle로만 예약 생성.
  handle: string;

  serviceId: string;
  dateISO: string; // YYYY-MM-DD
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  durationMin: number;
  bufferMin: number;

  // ✅ (권장) 최소 정보. 아직 UI 없으면 일단 optional로 두고,
  // 나중에 BookingScreen에서 입력 받도록 바꾸면 됨.
  name?: string;
  contact?: string;
};

export async function saveReservation(params: Params) {
  const handle = (params.handle ?? "").trim().toLowerCase();
  if (!handle) throw new Error("예약 실패: handle이 없습니다.");

  // ✅ 입력 방어
  if (params.durationMin <= 0) {
    throw new Error("예약 실패: durationMin은 0보다 커야 합니다.");
  }
  if (params.bufferMin < 0) {
    throw new Error("예약 실패: bufferMin은 0 이상이어야 합니다.");
  }

  // ✅ RLS/권한 모델상 reservations 직접 select/insert 금지
  // ✅ 반드시 DB 함수(RPC)로만 생성
  const { error } = await supabase.rpc("create_reservation_by_handle", {
    p_handle: handle,
    p_service_id: params.serviceId,
    p_date: params.dateISO,
    p_start_time: params.start,
    p_end_time: params.end,
    p_duration_min: params.durationMin,
    p_buffer_min: params.bufferMin,
    p_name: (params.name ?? "").trim(),
    p_contact: (params.contact ?? "").trim(),
  });

  if (error) {
    // DB에서 충돌/검증 에러를 message로 내려주면 그대로 사용자에게 보여주기 좋음
    throw new Error(error.message);
  }
}