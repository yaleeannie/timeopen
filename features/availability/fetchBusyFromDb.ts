// features/availability/fetchBusyFromDb.ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Busy = { start: string; end: string };

// "HH:MM" -> minutes
function toMin(t: string) {
  const [hh, mm] = t.slice(0, 5).split(":").map(Number);
  return hh * 60 + mm;
}

// busy 배열을 분 단위로 쓰기 좋게 변환
export function busyToMinutes(busy: Busy[]) {
  return busy
    .map((b) => ({
      startMin: toMin(b.start),
      endMin: toMin(b.end),
    }))
    .filter((x) => Number.isFinite(x.startMin) && Number.isFinite(x.endMin) && x.startMin < x.endMin);
}

/**
 * 특정 handle + 특정 날짜(dateISO = "YYYY-MM-DD")의 예약된 시간들을 가져옴
 * - cancelled 제외
 * - confirmed만 쓰는 것도 가능하지만, 일단 "cancelled만 제외"가 안전
 */
export async function fetchBusyFromDb(params: { handle: string; dateISO: string }) {
  const supabase = createSupabaseBrowserClient();
  const handle = params.handle.trim().toLowerCase();

  // 1) handle -> organization_id
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (orgErr) throw new Error(`org 조회 실패: ${orgErr.message}`);
  if (!org?.id) throw new Error(`org not found for handle=${handle}`);

  // 2) 해당 날짜 예약 조회 (status cancelled 제외)
  // ⭐ 핵심: date 컬럼으로 먼저 좁히고, start_time/end_time을 그대로 busy로 씀
  // (너 DB는 start_time/end_time이 text라서 이게 제일 안전)
  const { data: rows, error } = await supabase
    .from("reservations")
    .select("start_time,end_time,status")
    .eq("organization_id", org.id)
    .eq("date", params.dateISO)
    .neq("status", "cancelled");

  if (error) throw new Error(`busy 조회 실패: ${error.message}`);

  const busy: Busy[] =
    rows?.map((r: any) => ({
      start: String(r.start_time).slice(0, 5),
      end: String(r.end_time).slice(0, 5),
    })) ?? [];

  return { organizationId: org.id, busy };
}