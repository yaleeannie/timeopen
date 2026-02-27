// features/booking/saveReservation.ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client"; // 프로젝트에 맞게 경로만 확인

type Params = {
  organizationId: string;
  date: string;       // "2026-02-26"
  start: string;      // "14:15"
  end: string;        // "14:45"
  serviceId?: string;
};

function toIsoUtc(date: string, hhmm: string) {
  // ⚠️ 지금 DB에 찍힌 게 +00 이라서(UTC) 우선 UTC로 저장되게 구성
  // 나중에 KST 기준으로 바꾸고 싶으면 여기만 바꾸면 됨.
  return new Date(`${date}T${hhmm}:00.000Z`).toISOString();
}

export async function saveReservation(params: Params) {
  const supabase = createSupabaseBrowserClient();

  const start_at = toIsoUtc(params.date, params.start);
  const end_at = toIsoUtc(params.date, params.end);

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      organization_id: params.organizationId,
      date: params.date,
      start_time: params.start, // 기존 UI/표시용 유지
      end_time: params.end,     // 기존 UI/표시용 유지
      start_at,
      end_at,
      status: "confirmed",
      service_id: params.serviceId ?? null,
    })
    .select()
    .single();

  if (error) {
    // ✅ DB에서 겹침 제약이 터지면 사용자에게 친절히
    const msg = (error as any)?.message ?? "";
    if (msg.includes("reservations_no_overlap")) {
      throw new Error("예약 충돌: 기존 예약과 시간이 겹칩니다.");
    }
    throw new Error(`예약 저장 실패: ${msg}`);
  }

  return data;
}