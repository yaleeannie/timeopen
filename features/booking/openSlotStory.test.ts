import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOpenSlotStorySvg,
  formatOpenSlotStoryLabel,
} from "./openSlotStory";

test("formats story labels for today and a future date", () => {
  assert.equal(
    formatOpenSlotStoryLabel("2026-06-23", "15:00", "2026-06-23"),
    "오늘 3:00 예약 가능"
  );
  assert.equal(
    formatOpenSlotStoryLabel("2026-06-28", "15:00", "2026-06-23"),
    "6월 28일 3:00 예약 가능"
  );
});

test("builds a 1080 by 1920 SVG and escapes editable text", () => {
  const svg = buildOpenSlotStorySvg({
    dateISO: "2026-06-28",
    time: "15:00",
    note: "젤 & 네일 가능",
    shopName: "Jisu <Nail>",
    todayISO: "2026-06-23",
    theme: {
      primary: "#00C1FF",
      accent: "#00D6F7",
      soft: "#E9FAFF",
      glow: true,
      ink: "#009ED3",
      contrast: "#FFFFFF",
    },
  });

  assert.match(svg, /width="1080" height="1920"/);
  assert.match(svg, /6월 28일 3:00/);
  assert.match(svg, /예약 가능/);
  assert.match(svg, /Jisu &lt;Nail&gt;/);
  assert.match(svg, /젤 &amp; 네일 가능/);
});
