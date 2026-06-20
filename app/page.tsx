import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const features = [
  {
    number: "01",
    title: "예약 링크 만들기",
    description: "가게만의 짧은 링크를 만들어 어디서든 고객에게 공유하세요.",
  },
  {
    number: "02",
    title: "서비스와 가격 관리",
    description: "메뉴, 소요 시간, 가격을 한곳에서 간편하게 관리할 수 있어요.",
  },
  {
    number: "03",
    title: "영업시간 설정",
    description: "요일별 영업시간과 쉬는 시간을 설정하면 가능한 시간만 보여드려요.",
  },
  {
    number: "04",
    title: "다국어 예약 화면",
    description: "고객의 언어에 맞춘 예약 화면으로 외국인 고객도 쉽게 예약해요.",
  },
  {
    number: "05",
    title: "예약 문자 알림",
    description: "예약이 들어오면 사장님과 고객에게 예약 내용을 문자로 알려드려요.",
  },
];

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/owner");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f8f3] text-gray-950">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pb-16 sm:pt-6">
        <header className="flex items-center justify-between rounded-full border border-white/80 bg-white/85 px-4 py-3 shadow-[0_10px_35px_rgba(82,130,120,0.08)] backdrop-blur sm:px-5">
          <a href="/" className="flex min-h-10 items-center gap-2.5" aria-label="TimeOpen 홈">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] text-base font-black text-white shadow-[0_8px_18px_rgba(40,185,220,0.2)]">
              T
            </span>
            <span className="text-lg font-black tracking-[-0.04em]">TimeOpen</span>
          </a>
          <a
            href="/login"
            className="flex min-h-10 items-center rounded-full px-4 text-sm font-bold text-[#168ca8] transition hover:bg-[#ecfbfd]"
          >
            로그인
          </a>
        </header>

        <section className="relative overflow-hidden rounded-b-[36px] px-1 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
          <div className="pointer-events-none absolute -right-16 top-12 h-52 w-52 rounded-full bg-[#d8f7f2] blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-4 h-44 w-44 rounded-full bg-[#fff1cf] blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-[#cceff2] bg-[#ecfbfd] px-3.5 py-2 text-xs font-black text-[#168ca8]">
              예약을 더 쉽고 가깝게
            </div>
            <h1 className="mx-auto mt-5 max-w-2xl text-[2.35rem] font-black leading-[1.12] tracking-[-0.055em] sm:text-6xl sm:leading-[1.08]">
              외국인 고객도
              <br />
              쉽게 예약하는 링크
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] font-medium leading-7 text-gray-600 sm:text-lg sm:leading-8">
              서비스, 영업시간, 예약 링크를 만들면 고객은 번역된 예약 화면에서 바로 예약할 수 있어요.
            </p>
            <div className="mx-auto mt-8 grid max-w-sm gap-3 sm:grid-cols-2">
              <a
                href="/signup"
                className="flex min-h-14 items-center justify-center rounded-2xl bg-[#28b9dc] px-6 text-base font-black text-white shadow-[0_14px_28px_rgba(40,185,220,0.24)] transition hover:bg-[#20afd2]"
              >
                무료로 시작하기
              </a>
              <a
                href="/login"
                className="flex min-h-14 items-center justify-center rounded-2xl border border-[#dceef2] bg-white px-6 text-base font-black text-[#287789] shadow-sm transition hover:bg-[#f3fcfd]"
              >
                로그인
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl">
          <div className="rounded-[30px] border border-[#dff0ee] bg-[#dff7f3] p-3 shadow-[0_22px_60px_rgba(62,127,120,0.14)] sm:p-5">
            <div className="overflow-hidden rounded-[24px] bg-[#fbfdfd] p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#28b9dc]">오늘의 예약</div>
                  <div className="mt-1 text-2xl font-black tracking-[-0.04em]">오늘 예약 3건</div>
                </div>
                <div className="rounded-full bg-[#e7faf5] px-3 py-1.5 text-xs font-black text-[#168b72]">
                  운영 중
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-[#e5f3f6] bg-white p-3 shadow-sm">
                  <div className="flex h-14 w-[68px] shrink-0 items-center justify-center rounded-xl bg-[#28b9dc] text-sm font-black text-white">
                    11:00
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black">커트 · Mina</div>
                    <div className="mt-1 text-xs font-medium text-gray-400">30분</div>
                  </div>
                  <div className="shrink-0 rounded-full bg-[#e7faf5] px-2.5 py-1.5 text-[11px] font-black text-[#168b72]">
                    문자 완료
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#e5f3f6] bg-white p-3 shadow-sm">
                  <div className="flex h-14 w-[68px] shrink-0 items-center justify-center rounded-xl bg-[#eef7f8] text-sm font-black text-[#3f7b88]">
                    14:30
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black">염색 · Yuki</div>
                    <div className="mt-1 text-xs font-medium text-gray-400">90분</div>
                  </div>
                  <div className="shrink-0 rounded-full bg-[#eef2f3] px-2.5 py-1.5 text-[11px] font-black text-gray-500">
                    예약 완료
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#fff8e8] px-4 py-3">
                <span className="text-xs font-bold text-[#97733c]">내 예약 링크</span>
                <span className="text-sm font-black text-[#735523]">timeopen.app/u/yourshop</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl py-16 sm:py-24">
          <div className="mb-7 px-1">
            <div className="text-sm font-black text-[#28b9dc]">가게 운영에 필요한 것만</div>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">
              예약 준비부터 알림까지
              <br />
              한 번에 관리하세요
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`rounded-[24px] border border-[#e4efed] bg-white p-5 shadow-[0_10px_30px_rgba(82,130,120,0.07)] ${
                  index === features.length - 1 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8faf8] text-xs font-black text-[#1ba6b8]">
                  {feature.number}
                </div>
                <h3 className="mt-4 text-lg font-black tracking-[-0.025em]">{feature.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-gray-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] bg-[#28b9dc] px-6 py-10 text-center text-white shadow-[0_20px_50px_rgba(40,185,220,0.22)] sm:px-10 sm:py-14">
          <div className="text-sm font-bold text-white/80">지금 바로 시작해보세요</div>
          <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.045em]">
            고객이 기다리지 않는
            <br />
            내 예약 링크
          </h2>
          <a
            href="/signup"
            className="mx-auto mt-7 flex min-h-14 max-w-xs items-center justify-center rounded-2xl bg-white px-6 text-base font-black text-[#159bb9] shadow-lg transition hover:bg-[#f4fdff]"
          >
            내 예약 링크 만들기
          </a>
        </section>

        <footer className="py-8 text-center">
          <div className="text-sm font-black text-[#279db7]">TimeOpen</div>
          <p className="mt-1 text-xs font-medium text-gray-400">예약을 열면, 고객과 더 가까워집니다.</p>
        </footer>
      </div>
    </main>
  );
}
