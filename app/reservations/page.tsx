// app/reservations/page.tsx
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
      return status;
  }
}

export default async function ReservationsPage(props: { searchParams?: SearchParams }) {
  const resolved = props.searchParams ? await props.searchParams : undefined;
  const handle = pickHandle(resolved)?.trim().toLowerCase() ?? null;

  const supabase = await createSupabaseServerClient();
  
  // ✅ 1) 로그인 필수 (owner 전용)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>로그인이 필요합니다.</div>
        <div style={{ color: "#666" }}>owner만 예약 목록을 볼 수 있어요.</div>
      </div>
    );
  }

  // ✅ 2) 대상 org 결정: (a) handle 있으면 그 org, (b) 없으면 내가 owner인 첫 org
  let orgId: string | null = null;
  let orgHandle: string | null = null;

  if (handle) {
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, handle")
      .eq("handle", handle)
      .maybeSingle();

    if (orgErr || !org?.id) {
      return <div style={{ padding: 16 }}>존재하지 않는 handle: {handle}</div>;
    }

    // ✅ 3) membership으로 owner 검증 (URL/handle을 신뢰하지 않음)
    const { data: m, error: mErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", org.id)
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();

    if (mErr || !m) {
      return (
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>접근 권한이 없습니다.</div>
          <div style={{ color: "#666" }}>해당 organization의 owner가 아니에요.</div>
        </div>
      );
    }

    orgId = org.id;
    orgHandle = org.handle;
  } else {
    const { data: mem, error: memErr } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (memErr || !mem?.organization_id) {
      return (
        <div style={{ padding: 16 }}>
          <div>owner로 연결된 organization이 없습니다.</div>
        </div>
      );
    }

    orgId = mem.organization_id;

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("handle")
      .eq("id", orgId)
      .maybeSingle();

    orgHandle = org?.handle ?? null;
  }

  // ✅ 4) reservations 조회 (RLS로 자동 스코프 제한됨)
  const { data: rows, error: resErr } = await supabase
    .from("reservations")
    .select("date,start_time,end_time,status,service_id,name,contact")
    .eq("organization_id", orgId!)
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
        org: {orgHandle ?? "-"} ({orgId})
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
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>서비스</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{String(r.date)}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{String(r.start_time).slice(0, 5)}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{String(r.end_time).slice(0, 5)}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{String(r.service_id ?? "-")}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{formatStatus(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}