import assert from "node:assert/strict";
import test from "node:test";

import { computeAvailableStartTimes } from "./computeAvailableStartTimes";
import { SLOT_INTERVAL_MINUTES } from "./slotInterval";

const baseParams = {
  breaks: [],
  busy: [],
  bufferMin: 0,
};

test("기본 영업시간에서 10분 단위 슬롯을 생성한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "10:00" }],
    durationMin: 30,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.deepEqual(result, ["09:00", "09:10", "09:20", "09:30"]);
});

test("예약 종료가 영업 종료와 정확히 같으면 포함한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "18:00" }],
    durationMin: 60,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.equal(result.includes("17:00"), true);
  assert.equal(result.includes("17:10"), false);
});

test("buffer가 영업 종료를 넘어가도 duration이 영업시간 안이면 포함한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "18:00" }],
    durationMin: 60,
    bufferMin: 30,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.equal(result.includes("17:00"), true);
});

test("정리시간 buffer는 실제 차단 시간에 포함한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "12:00", end: "18:00" }],
    durationMin: 90,
    bufferMin: 10,
    stepMin: 100,
  });

  assert.deepEqual(result, ["12:00", "13:40", "15:20"]);
});

test("서비스 소요시간 모드는 서비스 시간 간격으로 슬롯을 생성한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "12:00", end: "18:00" }],
    durationMin: 90,
    bufferMin: 0,
    stepMin: 90,
  });

  assert.deepEqual(result, ["12:00", "13:30", "15:00", "16:30"]);
});

test("서비스 소요시간 모드에서도 기존 예약과 겹치면 제외한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "12:00", end: "18:00" }],
    busy: [{ start: "13:30", end: "15:00" }],
    durationMin: 90,
    bufferMin: 0,
    stepMin: 90,
  });

  assert.deepEqual(result, ["12:00", "15:00", "16:30"]);
});

test("휴게시간과 겹치는 슬롯을 제외한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    breaks: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.equal(result.includes("09:40"), false);
  assert.equal(result.includes("10:00"), false);
  assert.equal(result.includes("10:50"), false);
});

test("휴게 종료 시각과 예약 시작 시각이 같으면 허용한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    breaks: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.equal(result.includes("11:00"), true);
});

test("기존 예약과 겹치는 슬롯을 제외한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    busy: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.equal(result.includes("09:40"), false);
  assert.equal(result.includes("10:00"), false);
  assert.equal(result.includes("10:50"), false);
});

test("기존 예약 종료 시각과 새 예약 시작 시각이 같으면 허용한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    busy: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.equal(result.includes("11:00"), true);
});

test("workWindows가 빈 배열이면 빈 결과를 반환한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [],
    durationMin: 30,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.deepEqual(result, []);
});

test("notBefore보다 이전 슬롯을 제외한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "10:00" }],
    durationMin: 15,
    stepMin: SLOT_INTERVAL_MINUTES,
    notBefore: "09:30",
  });

  assert.deepEqual(result, ["09:30", "09:40"]);
});

test("notBefore가 슬롯 사이에 있으면 다음 슬롯부터 허용한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "10:00" }],
    durationMin: 15,
    stepMin: SLOT_INTERVAL_MINUTES,
    notBefore: "09:11",
  });

  assert.deepEqual(result, ["09:20", "09:30", "09:40"]);
});

test("중복 workWindows는 현재 운영 동작대로 중복 슬롯을 반환한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [
      { start: "09:00", end: "10:00" },
      { start: "09:00", end: "10:00" },
    ],
    durationMin: 30,
    stepMin: 30,
  });

  assert.deepEqual(result, ["09:00", "09:30", "09:00", "09:30"]);
});

test("stepMin이 0 이하이면 빈 결과를 반환한다", () => {
  for (const stepMin of [0, -SLOT_INTERVAL_MINUTES]) {
    const result = computeAvailableStartTimes({
      ...baseParams,
      workWindows: [{ start: "09:00", end: "10:00" }],
      durationMin: 30,
      stepMin,
    });

    assert.deepEqual(result, []);
  }
});

test("durationMin이 0 이하이면 빈 결과를 반환한다", () => {
  for (const durationMin of [0, -30]) {
    const result = computeAvailableStartTimes({
      ...baseParams,
      workWindows: [{ start: "09:00", end: "10:00" }],
      durationMin,
      stepMin: SLOT_INTERVAL_MINUTES,
    });

    assert.deepEqual(result, []);
  }
});

test("bufferMin이 음수이면 빈 결과를 반환한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "10:00" }],
    durationMin: 30,
    bufferMin: -1,
    stepMin: SLOT_INTERVAL_MINUTES,
  });

  assert.deepEqual(result, []);
});
