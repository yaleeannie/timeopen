export const metadata = {
  title: "서비스 일시 중지 | TimeOpen",
  description: "TimeOpen 서비스를 잠시 쉬어갑니다.",
};

export default function MaintenancePage() {
  return (
    <main className="soft-page-bg flex min-h-screen items-center justify-center px-4 py-12 text-slate-950">
      <section className="glass-shell w-full max-w-xl rounded-[32px] px-6 py-12 text-center sm:px-12 sm:py-16">
        <div className="brand-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-[0_8px_18px_rgba(0,193,255,0.2)]">
          T
        </div>
        <p className="brand-text mt-7 text-sm font-black tracking-[0.12em]">TIMEOPEN</p>
        <h1 className="mt-3 text-2xl font-black leading-tight tracking-[-0.04em] sm:text-3xl">
          TimeOpen 서비스를 잠시 쉬어갑니다.
        </h1>
        <p className="mt-5 text-sm font-medium leading-7 text-slate-600 sm:text-base sm:leading-8">
          더 나은 서비스를 준비하기 위해 TimeOpen 서비스를 잠시 중지합니다.
          이용에 불편을 드려 죄송합니다. 준비가 완료되면 다시 찾아뵙겠습니다.
          감사합니다.
        </p>
      </section>
    </main>
  );
}
