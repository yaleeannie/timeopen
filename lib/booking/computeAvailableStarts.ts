export type TimeRange = {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"  [start,end)
};

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

type MinRange = { start: number; end: number };

function normalize(ranges: TimeRange[]): MinRange[] {
  const mins = ranges
    .map((r) => ({ start: toMin(r.start), end: toMin(r.end) }))
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end))
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start - b.start);

  const merged: MinRange[] = [];
  for (const r of mins) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push({ ...r });
      continue;
    }

    // ✅ 겹칠 때만 merge (맞닿음은 merge하지 않음)
    if (r.start < last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  return merged;
}

export function computeAvailableStartTimes(args: {
  workWindows: TimeRange[];
  busy?: TimeRange[];
  breaks?: TimeRange[];
  durationMin: number;
  bufferMin: number;
  stepMin?: number;
}): string[] {
  const step = args.stepMin ?? 15;
  const blockMin = args.durationMin + args.bufferMin;

  if (step <= 0) return [];
  if (!Number.isFinite(blockMin) || blockMin <= 0) return [];

  const windows = normalize(args.workWindows);
  if (windows.length === 0) return [];

  const blockers = normalize([...(args.busy ?? []), ...(args.breaks ?? [])]);

  const out: string[] = [];

  for (const w of windows) {
    for (let t = w.start; t + blockMin <= w.end; t += step) {
      const end = t + blockMin;
      const conflict = blockers.some((b) => overlaps(t, end, b.start, b.end));
      if (!conflict) out.push(toHHMM(t));
    }
  }

  return Array.from(new Set(out)).sort((a, b) => toMin(a) - toMin(b));
}