import { computeAvailableStartTimes } from "./computeAvailableStarts";

type Case = {
  name: string;
  input: Parameters<typeof computeAvailableStartTimes>[0];
  expectIncludes?: string[];
  expectExcludes?: string[];
};

const cases: Case[] = [
  {
    name: "a) work 09-18, break 13-14, duration 60 buffer 10 step 20",
    input: {
      workWindows: [{ start: "09:00", end: "18:00" }],
      breaks: [{ start: "13:00", end: "14:00" }],
      busy: [],
      durationMin: 60,
      bufferMin: 10,
      stepMin: 20,
    },
    expectExcludes: ["13:00"],
  },
  {
    name: "b) work 09-18, busy 13-17, long service 240+10",
    input: {
      workWindows: [{ start: "09:00", end: "18:00" }],
      busy: [{ start: "13:00", end: "17:00" }],
      breaks: [],
      durationMin: 240,
      bufferMin: 10,
      stepMin: 20,
    },
  },
  {
    name: "c) end boundary check (17:00 start should be valid)",
    input: {
      workWindows: [{ start: "09:00", end: "18:00" }],
      busy: [],
      breaks: [],
      durationMin: 60,
      bufferMin: 0,
      stepMin: 15,
    },
    expectIncludes: ["17:00"],
    expectExcludes: ["18:00"],
  },
];

function runCases() {
  for (const c of cases) {
    const out = computeAvailableStartTimes(c.input);
    console.log(`\n[${c.name}]`);
    console.log("first:", out.slice(0, 12), "len=", out.length);

    for (const t of c.expectIncludes ?? []) {
      if (!out.includes(t)) console.error("❌ expected include:", t);
    }
    for (const t of c.expectExcludes ?? []) {
      if (out.includes(t)) console.error("❌ expected exclude:", t);
    }
  }
}

runCases();