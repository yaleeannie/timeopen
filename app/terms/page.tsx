const sections = [
  {
    title: "1. 목적",
    body: [
      "이 약관은 TimeOpen이 제공하는 예약 링크 및 예약 관리 서비스의 이용 조건, 회원과 TimeOpen 사이의 권리·의무 및 책임 사항을 정하기 위한 것입니다.",
    ],
  },
  {
    title: "2. 서비스의 내용",
    body: [
      "TimeOpen은 매장 운영자가 인스타 프로필 등에 공유할 수 있는 예약 링크를 만들고, 고객이 로그인 없이 서비스를 선택해 예약할 수 있도록 돕는 도구입니다.",
      "서비스에는 예약 링크 생성, 샵 프로필 관리, 서비스명·설명·가격·소요시간 관리, 영업시간·휴무일 설정, 예약 내역 관리, 예약 알림, 빈 시간 공유 등 관련 기능이 포함될 수 있습니다.",
    ],
  },
  {
    title: "3. 베타 서비스",
    body: [
      "TimeOpen은 현재 베타 서비스로 제공됩니다. 베타 기간에는 기능이 변경되거나 제한될 수 있으며, 점검이나 기술적 사유로 일부 기능이 일시적으로 중단될 수 있습니다.",
      "유료 플랜을 도입하는 경우 결제가 시작되기 전에 별도로 안내합니다. 기존 베타 사용자가 사전 안내 없이 자동으로 유료 결제되는 일은 없습니다.",
    ],
  },
  {
    title: "4. 회원가입 및 계정 관리",
    body: [
      "회원은 본인이 사용하는 정확한 이메일과 필요한 정보를 입력해야 합니다.",
      "회원은 계정, 비밀번호, 예약 링크, 매장 정보가 부정하게 사용되지 않도록 관리할 책임이 있습니다.",
      "회원의 관리 소홀로 발생한 문제에 대해서는 회원 본인이 책임을 부담합니다. 다만 TimeOpen의 고의 또는 중대한 과실이 있는 경우에는 관련 법령에 따릅니다.",
    ],
  },
  {
    title: "5. 매장 운영자의 책임",
    body: [
      "매장 운영자는 고객에게 표시되는 매장 정보, 서비스명, 서비스 설명, 가격, 소요시간, 정리시간, 영업시간, 휴무일, 예약 가능 시간, 취소·변경·환불·노쇼 정책, 고객 응대, 실제 서비스 제공에 대한 책임을 부담합니다.",
      "매장 운영자는 관련 법령과 업종별 준수 사항을 확인하고, 고객에게 정확하고 오해 없는 정보를 제공해야 합니다.",
    ],
  },
  {
    title: "6. 예약자 개인정보의 이용 제한",
    body: [
      "매장 운영자는 TimeOpen을 통해 확인한 예약자 개인정보를 예약 확인, 일정 변경, 취소 안내, 방문 관련 연락 등 예약 관리 목적 범위 내에서만 이용해야 합니다.",
      "매장 운영자는 예약자 개인정보를 무단으로 저장, 복제, 외부 제공, 마케팅 발송, 광고, 영업 목적 등 예약 관리와 무관한 목적으로 이용해서는 안 됩니다.",
      "매장 운영자가 예약자 개인정보를 부적절하게 이용하여 발생한 문제는 해당 매장 운영자의 책임으로 합니다. 다만 TimeOpen의 고의 또는 중대한 과실로 인해 발생한 손해에 대해서는 관련 법령에 따라 책임을 부담합니다.",
    ],
  },
  {
    title: "7. 고객 예약 및 매장-고객 관계",
    body: [
      "TimeOpen은 예약 링크와 예약 관리 기능을 제공하는 도구이며, 매장과 고객 사이의 실제 예약 계약, 방문, 시술 또는 서비스 제공의 당사자가 아닙니다.",
      "실제 서비스 제공, 결제, 환불, 예약 변경, 취소, 지연, 노쇼, 고객 응대, 분쟁 또는 손해는 원칙적으로 매장 운영자와 고객 사이에서 해결해야 합니다.",
    ],
  },
  {
    title: "8. TimeOpen의 책임 제한",
    body: [
      "TimeOpen은 예약 링크 및 예약 관리 기능을 제공하는 도구이며, 매장과 고객 사이의 실제 시술, 방문, 결제, 환불, 예약 변경, 노쇼, 분쟁에 직접 관여하지 않습니다.",
      "매장 정보, 서비스 가격, 예약 가능 시간, 취소 및 환불 정책은 각 매장 운영자가 직접 관리하며, 이와 관련하여 발생하는 문제는 매장과 고객 사이에서 해결하는 것을 원칙으로 합니다.",
      "다만 TimeOpen의 고의 또는 중대한 과실로 인해 회원에게 손해가 발생한 경우에는 관련 법령에 따라 책임을 부담합니다.",
    ],
  },
  {
    title: "9. 금지 행위",
    body: [
      "회원은 허위 정보 등록, 타인의 권리 침해, 불법·유해 콘텐츠 게시, 서비스의 정상적인 운영을 방해하는 행위, 부정한 방법으로 서비스를 이용하는 행위를 해서는 안 됩니다.",
      "TimeOpen은 위반 행위가 확인될 경우 서비스 이용을 제한하거나 필요한 조치를 취할 수 있습니다.",
    ],
  },
  {
    title: "10. 서비스 변경 및 중단",
    body: [
      "TimeOpen은 서비스 개선, 운영상 필요, 기술적 사유에 따라 기능을 변경하거나 일부 서비스를 중단할 수 있습니다.",
      "중요한 변경이 있는 경우 가능한 범위에서 사전에 안내합니다.",
    ],
  },
  {
    title: "11. 약관의 변경",
    body: [
      "TimeOpen은 필요한 경우 약관을 변경할 수 있습니다. 변경 내용은 서비스 화면 또는 별도 안내 수단을 통해 공지합니다.",
      "회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴를 요청할 수 있습니다.",
    ],
  },
  {
    title: "12. 문의",
    body: [
      "서비스 이용 및 약관에 대한 문의는 contact@timeopen.app 으로 보낼 수 있습니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="soft-page-bg min-h-screen px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <article className="glass-shell mx-auto max-w-3xl rounded-[32px] px-5 py-7 sm:px-8 sm:py-10">
        <a href="/" className="brand-text text-sm font-black">
          TimeOpen
        </a>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          이용약관
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          시행일: 2026년 6월 24일
        </p>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-black tracking-[-0.02em] text-slate-900">
                {section.title}
              </h2>
              <div className="mt-3 space-y-2 text-sm font-medium leading-7 text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2 text-sm font-bold">
          <a href="/privacy" className="brand-outline rounded-full px-4 py-2">
            개인정보 처리방침
          </a>
          <a href="/signup" className="brand-button rounded-full px-4 py-2">
            회원가입으로 돌아가기
          </a>
        </div>
      </article>
    </main>
  );
}
