export default function ReservationsLoading() {
  return (
    <main className="soft-page-bg min-h-screen px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full max-w-lg rounded-[28px] p-5 sm:rounded-[36px] sm:p-7">
        <div className="brand-chip inline-flex rounded-full px-3 py-1 text-xs font-black">
          예약을 불러오는 중...
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-8 w-36 rounded-2xl bg-white/70" />
          <div className="glass-card h-72 rounded-[24px]" />
          <div className="glass-card h-24 rounded-[20px]" />
          <div className="glass-card h-24 rounded-[20px]" />
        </div>
      </div>
    </main>
  );
}
