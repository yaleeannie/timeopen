const sections = [
  {
    title: "1. 수집하는 개인정보",
    body: [
      "TimeOpen은 회원가입 및 서비스 제공을 위해 이메일 주소, 비밀번호 등 계정 정보를 수집합니다.",
      "매장 운영자가 서비스를 이용하는 과정에서 샵 이름, 예약 링크 주소, 위치 안내, 예약 안내문, 서비스명, 서비스 설명, 가격, 소요시간, 영업시간, 휴무일 등 매장 운영 정보가 저장될 수 있습니다.",
      "고객이 공개 예약 링크에서 예약하는 경우 예약자 이름, 전화번호, 예약 날짜, 예약 시간, 선택한 서비스, 예약 상태 등 예약 관리에 필요한 정보가 저장될 수 있습니다.",
      "서비스 안정성 및 보안 관리를 위해 접속 기록, 기기 및 브라우저 정보, 오류 기록 등 기술 정보가 자동으로 생성될 수 있습니다.",
    ],
  },
  {
    title: "2. 개인정보의 수집·이용 목적",
    body: [
      "회원 식별, 로그인 및 계정 관리",
      "예약 링크 생성 및 공개 예약 페이지 제공",
      "서비스, 영업시간, 휴무일, 예약 내역 관리",
      "예약 확정, 취소, 변경 등 예약 관련 알림 제공",
      "고객 문의 응대, 오류 확인, 서비스 안정성 개선",
      "베타 서비스 안내 및 기능 개선을 위한 분석",
    ],
  },
  {
    title: "3. 예약 고객의 개인정보",
    body: [
      "수집 항목: 예약자 이름, 연락처, 예약 일시, 선택한 서비스, 요청사항",
      "수집 목적: 예약 접수, 예약 확인, 예약 변경·취소 안내, 매장과 고객 간 예약 관련 연락",
      "제공 및 공유: 예약 처리를 위해 해당 매장 운영자에게 예약 정보가 전달될 수 있습니다.",
      "보유 기간: 예약 관리 및 분쟁 대응을 위해 필요한 기간 동안 보관 후 파기합니다.",
      "동의 거부권: 개인정보 수집·이용에 동의하지 않을 경우 예약 접수가 제한될 수 있습니다.",
    ],
  },
  {
    title: "4. 보유 및 이용 기간",
    body: [
      "회원 정보는 회원 탈퇴 또는 서비스 이용 종료 요청 시까지 보관합니다.",
      "예약 정보와 매장 운영 정보는 예약 관리, 분쟁 대응, 서비스 안정성 확인을 위해 필요한 기간 동안 보관될 수 있습니다.",
      "관계 법령에 따라 보관이 필요한 정보는 해당 법령에서 정한 기간 동안 보관할 수 있습니다.",
      "베타 기간 중 탈퇴 요청이 접수되면 예약 링크는 닫히며, 데이터 삭제 또는 익명화는 확인 절차 후 진행될 수 있습니다.",
    ],
  },
  {
    title: "5. 개인정보의 제3자 제공",
    body: [
      "TimeOpen은 원칙적으로 회원과 고객의 개인정보를 제3자에게 판매하거나 임의로 제공하지 않습니다.",
      "다만 법령에 따른 요청이 있거나, 서비스 제공에 필요한 범위에서 회원이 동의한 경우에는 필요한 최소 범위의 정보가 제공될 수 있습니다.",
    ],
  },
  {
    title: "6. 개인정보 처리 위탁 및 외부 서비스",
    body: [
      "TimeOpen은 인증, 데이터 저장, 문자 알림, 이메일 발송, 호스팅 등 서비스 운영을 위해 외부 인프라와 도구를 사용할 수 있습니다.",
      "외부 서비스 이용 시 개인정보가 안전하게 처리되도록 필요한 범위에서 관리합니다.",
    ],
  },
  {
    title: "7. 문자 및 알림",
    body: [
      "예약 확정 또는 취소 등 예약 관리에 필요한 경우 매장 운영자 또는 고객에게 문자 알림이 발송될 수 있습니다.",
      "현재는 한국 번호 기준으로 먼저 테스트하고 있으며, 해외 번호 문자 알림은 준비 중입니다.",
    ],
  },
  {
    title: "8. 선택적 마케팅 및 베타 안내",
    body: [
      "회원이 선택적으로 동의한 경우 TimeOpen은 베타 소식, 기능 업데이트, 서비스 안내를 이메일로 보낼 수 있습니다.",
      "마케팅 및 베타 안내 수신 동의는 선택 사항이며, 동의하지 않아도 회원가입과 기본 서비스 이용에는 제한이 없습니다.",
    ],
  },
  {
    title: "9. 정보주체의 권리",
    body: [
      "회원은 본인의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.",
      "서비스 내에서 직접 수정할 수 없는 정보나 탈퇴 및 삭제 요청은 contact@timeopen.app 으로 문의할 수 있습니다.",
    ],
  },
  {
    title: "10. 개인정보 보호를 위한 조치",
    body: [
      "TimeOpen은 개인정보가 분실, 도난, 유출, 변조 또는 훼손되지 않도록 접근 권한 관리, 인증, 보안 설정 등 필요한 보호 조치를 적용합니다.",
      "다만 회원은 계정 정보와 비밀번호가 타인에게 노출되지 않도록 직접 관리해야 합니다.",
    ],
  },
  {
    title: "11. 문의",
    body: [
      "개인정보 수집·이용 및 처리에 대한 문의는 contact@timeopen.app 으로 보낼 수 있습니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="soft-page-bg min-h-screen px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <article className="glass-shell mx-auto max-w-3xl rounded-[32px] px-5 py-7 sm:px-8 sm:py-10">
        <a href="/" className="brand-text text-sm font-black">
          TimeOpen
        </a>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          개인정보 처리방침
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          개인정보 수집·이용 동의 내용을 포함합니다. 시행일: 2026년 6월 24일
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
          <a href="/terms" className="brand-outline rounded-full px-4 py-2">
            이용약관
          </a>
          <a href="/signup" className="brand-button rounded-full px-4 py-2">
            회원가입으로 돌아가기
          </a>
        </div>
      </article>
    </main>
  );
}
