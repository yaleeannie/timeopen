"use client";

type Props = {
  selection: {
    serviceId: string | null;
    dateISO: string | null;
    time: string | null;
  };
  onReserve: () => void;
};

export default function BookingCta({ selection, onReserve }: Props) {
  const ready =
    selection.serviceId !== null &&
    selection.dateISO !== null &&
    selection.time !== null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[#dceef2] bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-gray-700">
          {selection.dateISO ?? "날짜 선택"} · {selection.time ?? "시간 선택"}
        </div>
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={onReserve}
        className="min-h-11 shrink-0 rounded-xl bg-[#35bddc] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#20aeca] disabled:cursor-not-allowed disabled:bg-[#b8dfe8] disabled:opacity-100"
      >
        예약하기
      </button>
    </div>
  );
}
