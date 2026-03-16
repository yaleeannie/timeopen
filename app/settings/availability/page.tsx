export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AvailabilitySettingsClient from "./AvailabilitySettingsClient";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";

export default async function AvailabilitySettingsPage() {
  const Shell = ({ children }: { children: ReactNode }) => (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">{children}</div>
    </main>
  );

  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error) {
    return (
      <Shell>
        <div style={{ fontWeight: 800, color: "#b00020" }}>
          owner 정보를 불러오지 못했습니다: {error}
        </div>
      </Shell>
    );
  }

  if (!organizationId) {
    return (
      <Shell>
        <div style={{ fontWeight: 800, color: "#b00020" }}>
          owner로 연결된 organization이 없습니다.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ marginBottom: 12, fontSize: 13, color: "#666" }}>
        handle: {handle ?? "-"}
      </div>
      <AvailabilitySettingsClient organizationId={organizationId} />
    </Shell>
  );
}