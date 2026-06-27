export default function PublicBookingLoading() {
  return (
    <main className="soft-page-bg min-h-screen overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-4 px-2 text-sm font-black tracking-[-0.03em] text-[#00C9FF]">
          TimeOpen
        </div>

        <div className="glass-shell rounded-[28px] p-4 shadow-[0_24px_70px_rgba(0,193,255,0.12)] sm:rounded-[36px] sm:p-6">
          <div className="glass-card rounded-[24px] px-4 py-5 text-center">
            <div className="mx-auto h-4 w-28 rounded-full bg-[#dff7fc]" />
            <div className="mx-auto mt-3 h-3 w-56 max-w-full rounded-full bg-[#eef8fb]" />
            <p className="mt-5 text-sm font-black brand-text">
              예약 페이지를 불러오는 중이에요...
            </p>
          </div>

          <div className="mt-3 glass-card rounded-[24px] p-4">
            <div className="flex items-center gap-2" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#dff7fc]" />
                  <div className="h-2 min-w-0 flex-1 rounded-full bg-[#eef8fb]" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 glass-card rounded-[24px] p-4">
            <div className="h-4 w-24 rounded-full bg-[#dff7fc]" />
            <div className="mt-4 space-y-3" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-[18px] border border-white/70 bg-white/60 px-4 py-4">
                  <div className="h-4 w-1/2 rounded-full bg-[#dff7fc]" />
                  <div className="mt-3 h-3 w-1/3 rounded-full bg-[#eef8fb]" />
                  <div className="mt-3 h-3 w-5/6 rounded-full bg-[#eef8fb]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
