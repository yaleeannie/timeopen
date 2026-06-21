"use client";

import { useState } from "react";
import AvailabilitySettingsClient from "./AvailabilitySettingsClient";
import HolidaySettingsClient from "./HolidaySettingsClient";

type Tab = "hours" | "holidays";

export default function AvailabilityManagementClient({
  organizationId,
}: {
  organizationId: string;
}) {
  const [tab, setTab] = useState<Tab>("hours");

  return (
    <div>
      <div
        className="grid grid-cols-2 rounded-2xl border border-[#dceef2] bg-[#eef7f8] p-1"
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
              ? "bg-white text-[#168ca8] shadow-sm"
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
              ? "bg-white text-[#168ca8] shadow-sm"
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
          <AvailabilitySettingsClient organizationId={organizationId} />
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
