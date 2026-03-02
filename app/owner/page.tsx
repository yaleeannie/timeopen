// app/owner/page.tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔐 로그인 안 되어있으면 /login으로 이동
  if (!user) {
    redirect("/login");
  }

  // ✅ bootstrap (멱등)
  const { data } = await supabase.rpc("bootstrap_owner");
  const row = Array.isArray(data) ? data[0] : data;

  const handle = row?.handle ?? null;

  return (
    <main style={{ padding: 40 }}>
      <h1>TimeOpen 판매자 대시보드</h1>

      <div style={{ marginTop: 20 }}>
        <div>로그인됨: {user.email}</div>
        <div>handle: {handle}</div>
      </div>

      <div style={{ marginTop: 30 }}>
        <a href="/settings/availability">영업시간 설정</a>
      </div>

      <div style={{ marginTop: 10 }}>
        <a href={`/reservations?handle=${handle}`}>예약 확인</a>
      </div>

      <div style={{ marginTop: 10 }}>
        <a href={`/u/${handle}`}>예약 링크 미리보기</a>
      </div>
    </main>
  );
}