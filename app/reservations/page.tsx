// app/reservations/page.tsx
// Debug View: reservations only (NO edit/delete/filter/search)
// status만 한글로 표시

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

function pickHandle(sp: Record<string, string | string[] | undefined> | undefined) {
  const raw = sp?.handle;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function formatStatus(status: string | null) {
  if (!status) return "-";

  switch (status) {
    case "confirmed":
      return "예약 확정";
    case "cancelled":
      return "예약 취소";
    default:
      return status; // 혹시 다른 값 들어오면 그대로 출력
  }
}

export default async function ReservationsPage(props: { searchParams?: SearchParams }) {
  const resolved = props.searchParams ? await props.searchParams : undefined;
  const handle = pickHandle(resolved);

  if (!handle) {
    return (
      <div style={{ padding: 16 }}>
        <div>/reservations?handle=demo 처럼 handle을 붙여서 접속하세요.</div>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();

  // 1) org 조회
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id, handle")
    .eq("handle", handle)
    .maybeSingle();

  if (orgErr) {
    return (
      <div style={{ padding: 16 }}>
        <div>org 조회 실패: {orgErr.message}</div>
      </div>
    );
  }

  if (!org?.id) {
    return (
      <div style={{ padding: 16 }}>
        <div>org 없음 (handle: {handle})</div>
      </div>
    );
  }

  // 2) reservation 조회 (organizationId 스코프)
  const { data: rows, error: resErr } = await supabase
    .from("reservations")
    .select("date,start_time,end_time,status")
    .eq("organization_id", org.id)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (resErr) {
    return (
      <div style={{ padding: 16 }}>
        <div>reservations 조회 실패: {resErr.message}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        org: {org.handle} ({org.id})
      </div>

      {!rows || rows.length === 0 ? (
        <div>예약 없음</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>날짜</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>시작</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>종료</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {String(r.date)}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {String(r.start_time).slice(0, 5)}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {String(r.end_time).slice(0, 5)}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {formatStatus(r.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}