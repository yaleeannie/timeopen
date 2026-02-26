// features/availability/computeAvailableStartTimes.ts

// ⚠️ TimeOpen Core Rule
// This function MUST remain a pure computation engine.
//
// DO NOT:
// - store computed start times in DB
// - cache results
// - move logic into UI
// - introduce slot tables
//
// All availability must always be computed on demand.
// This is the heart of TimeOpen's model.
//
// Core Engine: available start times는 항상 계산값. DB/캐시/슬롯 저장 금지.

import type { TimeRange } from "./weeklySchedule";

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

function minToHhmm(v: number) {
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export function computeAvailableStartTimes(params: {
  workWindows: TimeRange[];
  breaks: TimeRange[];
  busy: TimeRange[];
  durationMin: number;
  bufferMin: number;
  stepMin: number;
}) {
  const { workWindows, breaks, busy, durationMin, bufferMin, stepMin } = params;

  // ✅ 잘못된 입력 방어: 엔진이 깨지지 않도록 안전하게 [] 반환
  if (durationMin <= 0) return [];
  if (bufferMin < 0) return [];
  if (stepMin <= 0) return [];

  const result: string[] = [];

  const blocked = [...breaks, ...busy].map((r) => ({
    start: hhmmToMin(r.start),
    end: hhmmToMin(r.end),
  }));

  for (const window of workWindows) {
    const start = hhmmToMin(window.start);
    const end = hhmmToMin(window.end);

    for (let t = start; t + durationMin <= end; t += stepMin) {
      const bookingEnd = t + durationMin + bufferMin;

      const conflict = blocked.some((b) =>
        overlaps(t, bookingEnd, b.start, b.end)
      );

      if (!conflict) {
        result.push(minToHhmm(t));
      }
    }
  }

  return result;
}