import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  eyebrow?: string;
};

export default function AuthShell({
  title,
  description,
  children,
  eyebrow = "TimeOpen",
}: Props) {
  return (
    <main className="soft-page-bg flex min-h-screen overflow-x-hidden px-3 py-5 text-slate-950 sm:px-5 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#00D6F7]/18 blur-[80px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-[#00C1FF]/14 blur-[90px]"
      />

      <div className="relative mx-auto flex w-full max-w-md items-center">
        <div className="glass-shell w-full overflow-hidden rounded-[32px] px-4 pb-6 pt-6 sm:rounded-[38px] sm:px-6 sm:pb-8 sm:pt-8">
          <header className="mb-6 text-center">
            <a
              href="/"
              aria-label="TimeOpen 홈"
              className="brand-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] text-2xl font-black text-white shadow-[0_14px_30px_rgba(0,193,255,0.22)]"
            >
              T
            </a>
            <div className="brand-text mt-4 text-sm font-black">{eyebrow}</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] text-slate-950">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
              {description}
            </p>
          </header>

          <section className="glass-card rounded-[26px] p-4 sm:p-5">{children}</section>

          <div className="mt-5 text-center">
            <a
              href="/"
              className="text-xs font-bold text-slate-400 transition hover:text-[#00A4D9]"
            >
              ← TimeOpen 홈으로
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
