// features/availability/fetchBusyFromDb.ts
import { supabase } from "@/lib/supabase/client";

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
  const handle = params.handle.trim().toLowerCase();

  const { data, error } = await supabase.rpc("get_busy_by_handle_date", {
    p_handle: handle,
    p_date: params.dateISO,
  });

  if (error) throw new Error(`busy 조회 실패: ${error.message}`);

  const busy: Busy[] =
    data?.map((r: any) => ({
      start: String(r.start_time).slice(0, 5),
      end: String(r.end_time).slice(0, 5),
    })) ?? [];

  return { busy };
}
