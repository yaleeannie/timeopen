// app/owner/page.tsx
import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";
import OwnerAuthBox from "./OwnerAuthBox";
import BookingLinkCopy from "./BookingLinkCopy";

export default async function OwnerPage() {
  const org = await fetchOrganizationByHandle("demo");

  if (!org) {
    return <div style={{ padding: 20 }}>organization not found for handle=demo</div>;
  }

  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <h2>TimeOpen 판매자 페이지</h2>

      <OwnerAuthBox />

      <div style={{ marginTop: 14, fontSize: 13, color: "#666" }}>
        <div>organizationId: {org.id}</div>
        <div>handle: {org.handle}</div>
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/settings/availability">영업시간 설정으로 이동</a>
      </div>

      <div style={{ marginTop: 12 }}>
        <a href={`/reservations?handle=${org.handle}`}>예약 확인 (Debug View)</a>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 6 }}>고객 예약 링크:</div>
        <BookingLinkCopy handle={org.handle} />
      </div>
    </div>
  );
}