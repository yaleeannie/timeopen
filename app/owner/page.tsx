// app/owner/page.tsx
// TimeOpen Seller Hub (NOT a dashboard)
// Just a link collection page.

export default function OwnerPage() {
  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <h2>TimeOpen 판매자 페이지</h2>

      <div style={{ marginTop: 20 }}>
        <a href="/settings/availability">
          영업시간 설정으로 이동
        </a>
      </div>

      <div style={{ marginTop: 12 }}>
        <a href="/reservations?handle=demo">
          예약 확인 (Debug View)
        </a>
      </div>

      <div style={{ marginTop: 12 }}>
        <div>
          고객 예약 링크:
        </div>
        <div>
          http://localhost:3000/u/demo
        </div>
      </div>
    </div>
  );
}