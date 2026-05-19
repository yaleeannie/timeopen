export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import ServicesEditor from "@/app/owner/ServicesEditor";

export default async function ServicesSettingsPage() {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) redirect("/login");

  if (error || !organizationId) {
    return <main style={{ padding: 24 }}>에러 발생</main>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>서비스 관리</h1>
      <ServicesEditor organizationId={organizationId} />
    </main>
  );
}