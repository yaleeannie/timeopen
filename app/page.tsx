import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import BetaInquiryModal from "./BetaInquiryModal";

export const dynamic = "force-dynamic";

const coreFeatures = [
  {
    number: "01",
    title: "인스타 프로필용 예약 링크",
    description:
      "프로필 링크를 누른 고객이 로그인 없이 서비스와 시간을 고르고 바로 예약해요.",
  },
  {
    number: "02",
    title: "DM 없는 예약 관리",
    description:
      "DM을 다시 확인하지 않아도 오늘과 앞으로의 예약을 시간순으로 확인해요.",
  },
  {
    number: "03",
    title: "서비스·가격·소요시간",
    description:
      "고객에게 보여질 서비스 설명, 가격, 소요시간을 깔끔한 카드로 보여줘요.",
  },
  {
    number: "04",
    title: "영업시간·휴무일 자동 반영",
    description:
      "운영 요일과 휴무일을 설정하면 고객 화면의 예약 가능 시간이 자동으로 달라져요.",
  },
];

const managementFeatures = [
  {
    icon: "빈",
    title: "빈 시간 공유",
    description: "예약 가능한 시간을 인스타 DM이나 스토리 문구로 바로 공유해요.",
  },
  {
    icon: "IMG",
    title: "스토리 이미지 저장",
    description: "빈 시간을 알리는 인스타 스토리용 이미지를 저장해 홍보할 수 있어요.",
  },
  {
    icon: "CAL",
    title: "월별 예약관리",
    description: "날짜별 예약 수와 선택한 날짜의 일정을 월간 캘린더에서 확인해요.",
  },
  {
    icon: "SMS",
    title: "문자 알림 상태",
    description: "현재는 한국 번호 기준으로 먼저 테스트하고 있어요. 해외 번호 문자 알림은 준비 중입니다.",
  },
  {
    icon: "文",
    title: "다국어 예약 화면",
    description: "다국어 예약은 준비 중이에요.",
  },
];

function DashboardPreview() {
  return (
    <div id="booking-preview" className="relative mx-auto w-full max-w-md scroll-mt-8">
      <div
        aria-hidden="true"
        className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-[#00D6F7]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-8 bottom-12 h-44 w-44 rounded-full bg-[#00C1FF]/20 blur-3xl"
      />

      <div className="glass-shell relative overflow-hidden rounded-[32px] p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="brand-text text-xs font-black">좋은 아침이에요</div>
            <div className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
              작은 매장 사장님
            </div>
            <div className="mt-1 text-xs font-medium text-slate-400">6월 22일 월요일</div>
          </div>
          <div className="brand-chip rounded-full px-3 py-1.5 text-[10px] font-black">
            오늘
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="glass-card relative overflow-hidden rounded-[20px] p-3.5">
            <div
              aria-hidden="true"
              className="absolute -right-5 -top-6 h-20 w-20 rounded-full bg-[#00D6F7]/25 blur-xl"
            />
            <div className="relative text-[10px] font-bold text-slate-400">
              이번 주 예약
            </div>
            <div className="relative mt-1 text-2xl font-black text-slate-950">
              12<span className="ml-1 text-xs text-slate-400">건</span>
            </div>
          </div>
          <div className="glass-card rounded-[20px] p-3.5">
            <div className="text-[10px] font-bold text-slate-400">인스타 예약 링크</div>
            <div className="mt-1 truncate text-xs font-black text-slate-700">
              /u/yourshop
            </div>
            <div className="brand-outline mt-2 inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black">
              링크 복사
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm font-black text-slate-900">오늘 일정</div>
          <div className="text-[10px] font-bold text-slate-400">3건</div>
        </div>

        <div className="relative mt-3 space-y-2.5 before:absolute before:bottom-5 before:left-[31px] before:top-5 before:w-px before:bg-gradient-to-b before:from-[#00D6F7]/20 before:via-[#00C1FF]/60 before:to-[#00C1FF]/15">
          {[
            { time: "09:00", customer: "김민지", service: "커트 · 30분" },
            { time: "13:30", customer: "박유나", service: "염색 · 90분" },
          ].map((reservation, index) => (
            <div
              key={reservation.time}
              className="relative grid grid-cols-[62px_1fr] gap-2"
            >
              <div className="relative z-10 pt-3 text-center">
                <div
                  className={
                    index === 0
                      ? "brand-selected inline-flex min-h-7 items-center rounded-full px-2 text-[10px] font-black"
                      : "brand-outline inline-flex min-h-7 items-center rounded-full px-2 text-[10px] font-black"
                  }
                >
                  {reservation.time}
                </div>
              </div>
              <div className="glass-card rounded-[18px] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-slate-900">
                      {reservation.customer}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
                      {reservation.service}
                    </div>
                  </div>
                  <span className="brand-chip shrink-0 rounded-full px-2 py-1 text-[9px] font-black">
                    확정
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/owner");
  }

  return (
    <main className="soft-page-bg overflow-x-hidden text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:pb-20 sm:pt-6">
        <header className="glass-card flex items-center justify-between rounded-full px-4 py-3 sm:px-5">
          <a href="/" className="flex min-h-10 items-center gap-2.5" aria-label="TimeOpen 홈">
            <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-base font-black text-white shadow-[0_8px_18px_rgba(0,193,255,0.2)]">
              T
            </span>
            <span className="text-lg font-black tracking-[-0.04em]">TimeOpen</span>
          </a>
          <nav className="flex items-center gap-1.5">
            <a
              href="/login"
              className="min-h-10 rounded-full px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-white/70 hover:text-[#00A4D9]"
            >
              로그인
            </a>
            <a
              href="/signup"
              className="brand-button hidden min-h-10 items-center rounded-full px-4 text-sm font-black sm:flex"
            >
              무료로 시작하기
            </a>
          </nav>
        </header>

        <section className="relative grid items-center gap-12 pb-20 pt-14 sm:pb-28 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-6 h-72 w-72 rounded-full bg-[#00D6F7]/16 blur-[90px]"
          />

          <div className="relative text-center lg:text-left">
            <div className="brand-chip inline-flex rounded-full px-3.5 py-2 text-xs font-black">
              1인 뷰티샵을 위한 인스타 예약 링크
            </div>
            <h1 className="mt-6 text-[2.55rem] font-black leading-[1.08] tracking-[-0.06em] sm:text-6xl lg:text-[4.25rem]">
              인스타 DM 예약,
              <br />
              <span className="brand-text">이제 링크 하나로</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              TimeOpen은 인스타로 예약받는 1인샵을 위한 간편 예약 링크예요.
              고객은 로그인 없이 서비스와 시간을 선택하고, 사장님은 DM 없이
              예약을 관리해요.
            </p>

            <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2 lg:mx-0">
              <BetaInquiryModal />
              <a
                href="#booking-preview"
                className="brand-outline flex min-h-14 items-center justify-center rounded-2xl px-6 text-base font-black"
              >
                예약 링크 예시 보기
              </a>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-400">
              네일샵·속눈썹샵·왁싱샵·1인 미용실·피부관리샵을 위한 초기 베타 서비스입니다.
            </p>
          </div>

          <DashboardPreview />
        </section>

        <section className="pb-20 sm:pb-28">
          <div className="glass-card relative overflow-hidden rounded-[32px] px-5 py-10 text-center sm:px-10 sm:py-14">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-44 w-80 -translate-x-1/2 rounded-full bg-[#00C1FF]/12 blur-3xl"
            />
            <div className="relative">
              <div className="brand-text text-sm font-black">인스타 DM으로 예약받고 있다면</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                DM, 전화, 카톡 예약이 흩어져 있나요?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                프로필에 TimeOpen 링크 하나만 올려두세요. 고객은 서비스와 가능한 시간을
                직접 고르고, 사장님은 흩어진 DM 대신 확정된 예약만 확인할 수 있어요.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-20 sm:pb-28">
          <div className="mb-8 max-w-2xl">
            <div className="brand-text text-sm font-black">핵심 기능</div>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">
              인스타에서 예약까지
              <br />
              가장 짧은 흐름으로
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {coreFeatures.map((feature) => (
              <article
                key={feature.title}
                className="glass-card group rounded-[26px] p-5 transition hover:-translate-y-1 hover:bg-white/80 sm:p-6"
              >
                <div className="brand-selected flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black">
                  {feature.number}
                </div>
                <h3 className="mt-6 text-xl font-black tracking-[-0.03em]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-20 sm:pb-28">
          <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
            <div>
              <div className="brand-text text-sm font-black">사장님용 관리 기능</div>
              <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">
                매일 확인하는 정보는
                <br />
                한 화면에 정리해요
              </h2>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-500 sm:text-base">
                서비스, 가격, 소요시간, 예약 현황, 빈 시간 공유와 베타 다국어 예약
                화면을 복잡한 도구 없이 TimeOpen 안에서 관리할 수 있어요.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {managementFeatures.map((feature) => (
                <article key={feature.title} className="glass-card rounded-[24px] p-5">
                  <div className="brand-soft inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl px-2 text-[10px] font-black">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-black tracking-[-0.03em]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-gradient-to-br from-[#00D6F7] to-[#00C1FF] px-5 py-12 text-center text-white shadow-[0_24px_60px_rgba(0,193,255,0.24)] sm:px-10 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/25 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <div className="text-sm font-black text-white/80">TimeOpen Beta</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              1인 뷰티샵 베타 파트너를 모집 중입니다.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-white/85 sm:text-base">
              베타 기간 동안 무료로 사용 가능하며, 정식 출시 후 월 정액제 플랜으로
              전환될 예정입니다.
            </p>
            <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
              <BetaInquiryModal variant="footer" />
              <a
                href="/signup"
                className="flex min-h-14 items-center justify-center rounded-2xl border border-white/70 bg-white/15 px-5 text-base font-black text-white backdrop-blur transition hover:bg-white/25"
              >
                회원가입으로 먼저 보기
              </a>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 py-8 text-center sm:flex-row sm:text-left">
          <div>
            <div className="brand-text text-sm font-black">TimeOpen</div>
            <p className="mt-1 text-xs font-medium text-slate-400">
              인스타로 예약받는 1인샵을 위한 간편 예약 링크.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <a href="/login" className="transition hover:text-[#00A4D9]">
              로그인
            </a>
            <a href="/signup" className="transition hover:text-[#00A4D9]">
              회원가입
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
