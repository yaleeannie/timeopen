"use client";

import { usePublicBookingI18n } from "./PublicBookingI18n";

type Props = {
  selection: {
    serviceId: string | null;
    dateISO: string | null;
    time: string | null;
  };
  onReserve: () => void;
  canReserve?: boolean;
};

export default function BookingCta({ selection, onReserve, canReserve = true }: Props) {
  const { t } = usePublicBookingI18n();
  const ready =
    selection.serviceId !== null &&
    selection.dateISO !== null &&
    selection.time !== null &&
    canReserve;

  return (
    <div className="glass-card flex items-center justify-between gap-3 rounded-[22px] p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-gray-700">
          {selection.dateISO ?? t("datePlaceholder")} · {selection.time ?? t("timePlaceholder")}
        </div>
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={onReserve}
        className="brand-button min-h-11 shrink-0 rounded-xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-[#b8dfe8] disabled:opacity-100"
      >
        {t("book")}
      </button>
    </div>
  );
}
