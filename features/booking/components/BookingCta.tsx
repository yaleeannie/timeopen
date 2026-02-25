"use client";

type Props = {
  handle: string;
  selection: {
    serviceId: string | null;
    dateISO: string | null;
    time: string | null;
  };
  onReserve: () => void;
};

export default function BookingCta({ handle, selection, onReserve }: Props) {
  const ready =
    selection.serviceId !== null &&
    selection.dateISO !== null &&
    selection.time !== null;

  return (
    <div className="border-t pt-6 flex items-center justify-between">
      <div className="text-sm text-neutral-600">
        <div className="font-medium">
          @{handle} · {selection.serviceId ?? "서비스 선택"}
        </div>

        <div>
          {selection.dateISO ?? "날짜"} · {selection.time ?? "시간"}
        </div>
      </div>

      <button
        disabled={!ready}
        onClick={onReserve}
        className="px-5 py-3 rounded-xl bg-black text-white disabled:opacity-30"
      >
        예약하기
      </button>
    </div>
  );
}