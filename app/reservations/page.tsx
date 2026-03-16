export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";

function formatStatus(status: string | null) {
  if (!status) return "-";
  switch (status) {
    case "confirmed":
      return "예약 확정";
    case "canceled":
      return "예약 취소";
    case "cancelled":
      return "예약 취소";
    default:
      return status;
  }
}

function formatDateText(r: any) {
  if (r?.date) return String(r.date);
  if (r?.start_at) return String(r.start_at).slice(0, 10);
  return "-";
}

function formatTimeText(value: unknown) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

export default async function ReservationsPage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, color: "#b00020" }}>
          owner 정보를 불러오지 못했습니다: {error}
        </div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, color: "#b00020" }}>
          owner organization을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: rows, error: resErr } = await supabase
    .from("reservations")
    .select(
      "id, organization_id, date, start_time, end_time, start_at, end_at, status, service_id, customer_name, customer_phone"
    )
    .eq("organization_id", organizationId)
    .order("start_at", { ascending: true });

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
        org: {handle ?? "-"} ({organizationId})
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
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>고객명</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>전화번호</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>서비스</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>상태</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{formatDateText(r)}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {formatTimeText(r.start_time ?? (r.start_at ? String(r.start_at).slice(11, 16) : null))}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {formatTimeText(r.end_time ?? (r.end_at ? String(r.end_at).slice(11, 16) : null))}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {r.customer_name ? String(r.customer_name) : "-"}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {r.customer_phone ? String(r.customer_phone) : "-"}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{String(r.service_id ?? "-")}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{formatStatus(r.status)}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {r.status === "confirmed" ? (
                    <form action={`/api/reservations/cancel`} method="post">
                      <input type="hidden" name="reservationId" value={String(r.id)} />
                      <button
                        type="submit"
                        style={{
                          border: "1px solid #111",
                          background: "#111",
                          color: "#fff",
                          padding: "6px 10px",
                          borderRadius: 8,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        예약 취소
                      </button>
                    </form>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}