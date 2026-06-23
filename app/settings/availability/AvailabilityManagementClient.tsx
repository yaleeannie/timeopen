"use client";

import { useState } from "react";
import AvailabilitySettingsClient from "./AvailabilitySettingsClient";
import HolidaySettingsClient from "./HolidaySettingsClient";
import { normalizeBookingSlotMode, type BookingSlotMode } from "@/features/booking/slotMode";

type Tab = "hours" | "holidays";

export default function AvailabilityManagementClient({
  organizationId,
  initialBookingSlotMode,
}: {
  organizationId: string;
  initialBookingSlotMode?: unknown;
}) {
  const [tab, setTab] = useState<Tab>("hours");
  const bookingSlotMode: BookingSlotMode = normalizeBookingSlotMode(initialBookingSlotMode);

  return (
    <div>
      <div
        className="grid grid-cols-2 rounded-2xl border border-white/70 bg-white/35 p-1 backdrop-blur-xl"
        role="tablist"
        aria-label="영업시간 관리 메뉴"
      >
        <button
          type="button"
          role="tab"
          aria-controls="availability-hours-panel"
          aria-selected={tab === "hours"}
          onClick={() => setTab("hours")}
          className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${
            tab === "hours"
              ? "brand-selected shadow-sm"
              : "text-gray-500"
          }`}
        >
          영업시간
        </button>
        <button
          type="button"
          role="tab"
          aria-controls="availability-holidays-panel"
          aria-selected={tab === "holidays"}
          onClick={() => setTab("holidays")}
          className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${
            tab === "holidays"
              ? "brand-selected shadow-sm"
              : "text-gray-500"
          }`}
        >
          휴무일
        </button>
      </div>

      <div
        id="availability-hours-panel"
        role="tabpanel"
        hidden={tab !== "hours"}
        className="mt-5"
      >
          <AvailabilitySettingsClient
            organizationId={organizationId}
            initialBookingSlotMode={bookingSlotMode}
          />
      </div>
      <div
        id="availability-holidays-panel"
        role="tabpanel"
        hidden={tab !== "holidays"}
        className="mt-5"
      >
        <HolidaySettingsClient />
      </div>
    </div>
  );
}
