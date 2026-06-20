import { redirect } from "next/navigation";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";

export const dynamic = "force-dynamic";

const onboardingSteps = [
  {
    number: "1",
    title: "매장 정보",
    description: "매장 이름과 연락처를 확인해요.",
    action: "매장 정보 설정",
    href: "/settings/profile",
  },
  {
    number: "2",
    title: "서비스 설정",
    description: "고객이 예약할 서비스와 가격, 소요 시간을 등록해요.",
    action: "서비스 설정",
    href: "/settings/services",
  },
  {
    number: "3",
    title: "영업시간 설정",
    description: "예약 가능한 요일과 쉬는 시간을 정해요.",
    action: "영업시간 설정",
    href: "/settings/availability",
  },
  {
    number: "4",
    title: "예약 링크 만들기",
    description: "고객에게 공유할 내 예약 링크를 확인해요.",
    action: "예약 링크 확인",
    href: "/owner",
  },
];

export default async function OnboardingPage() {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error || !organizationId) {
    return (
      <main className="flex min-h-screen items-center bg-white px-4 py-8 text-gray-950">
        <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#e2efee] bg-white p-6 text-center shadow-[0_20px_60px_rgba(80,145,164,0.12)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5e6] text-2xl font-black text-[#b7781f]">
            !
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-[-0.04em]">
            초기 설정을 준비하지 못했어요.
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 다시 로그인한 뒤 진행해 주세요.
          </p>
          <a
            href="/onboarding"
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(14,165,233,0.2)]"
          >
            다시 시도
          </a>
          <a
            href="/login"
            className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-[#168ca8]"
          >
            로그인으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-3 py-4 text-gray-950 sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-lg">
        <header className="rounded-[28px] bg-gradient-to-br from-[#effcfa] via-white to-[#fff9ea] px-5 pb-7 pt-8 text-center sm:rounded-[36px] sm:px-7 sm:pb-9 sm:pt-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] text-xl font-black text-white shadow-[0_12px_26px_rgba(40,185,220,0.22)]">
            T
          </div>
          <div className="mt-4 text-sm font-black text-[#20aeca]">TimeOpen 시작하기</div>
          <h1 className="mx-auto mt-2 max-w-sm text-3xl font-black leading-[1.2] tracking-[-0.045em]">
            예약 링크를 만들 준비를 해볼까요?
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-gray-500">
            몇 가지만 설정하면 고객이 로그인 없이 예약할 수 있는 링크를 만들 수 있어요.
          </p>
        </header>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-lg font-black tracking-[-0.03em]">설정 순서</h2>
            <span className="rounded-full bg-[#ecfbfd] px-3 py-1.5 text-xs font-black text-[#168ca8]">
              모두 나중에 가능
            </span>
          </div>

          <ol className="grid gap-3">
            {onboardingSteps.map((step) => (
              <li
                key={step.title}
                className="rounded-[24px] border border-[#e2efee] bg-white p-4 shadow-[0_12px_34px_rgba(82,130,120,0.08)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8faf8] text-sm font-black text-[#159bb9]">
                    {step.number}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-lg font-black tracking-[-0.025em]">{step.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-5 text-gray-500">{step.description}</p>
                  </div>
                </div>
                <a
                  href={step.href}
                  className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#cfeef2] bg-[#f2fcfd] px-4 text-sm font-black text-[#168ca8] transition hover:border-[#9de2eb] hover:bg-[#e7fafd]"
                >
                  {step.action}
                </a>
              </li>
            ))}
          </ol>
        </section>

        <a
          href="/owner"
          className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 text-base font-black text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)] transition hover:from-cyan-500 hover:to-sky-600"
        >
          건너뛰고 대시보드로 가기
        </a>
        <p className="mt-3 text-center text-xs font-medium leading-5 text-gray-400">
          건너뛴 설정은 대시보드에서 언제든 다시 할 수 있어요.
        </p>
      </div>
    </main>
  );
}
