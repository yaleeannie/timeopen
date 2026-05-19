export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import ProfileEditor from "@/app/owner/ProfileEditor";

export default async function ProfilePage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error || !organizationId) {
    return <div style={{ padding: 24 }}>오류: {error}</div>;
  }

  const supabase = await createSupabaseServerClient();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name, handle, location_text, notice_text")
    .eq("id", organizationId)
    .maybeSingle();

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>기본정보 및 추가정보</h1>

      <ProfileEditor
        organizationId={organizationId}
        initialName={orgRow?.name ?? ""}
        initialHandle={orgRow?.handle ?? ""}
        initialLocation={orgRow?.location_text ?? ""}
        initialNotice={orgRow?.notice_text ?? ""}
      />
    </main>
  );
}