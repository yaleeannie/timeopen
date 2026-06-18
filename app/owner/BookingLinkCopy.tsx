"use client";

import { useState } from "react";
import { getBookingUrl } from "@/lib/siteUrl";

export default function BookingLinkCopy({ handle }: { handle: string }) {
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      const url = getBookingUrl(handle);
      await navigator.clipboard.writeText(url);
      setStatus("복사됨");
      setTimeout(() => setStatus(""), 1200);
    } catch {
      setStatus("복사 실패(권한)");
      setTimeout(() => setStatus(""), 1500);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <code style={{ overflowWrap: "anywhere" }}>{getBookingUrl(handle)}</code>
      <button type="button" onClick={copy} style={{ fontSize: 13, padding: "4px 8px" }}>
        복사
      </button>
      <span style={{ fontSize: 12, color: "#666" }} aria-live="polite">
        {status}
      </span>
    </div>
  );
}
