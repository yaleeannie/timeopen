import assert from "node:assert/strict";
import test from "node:test";

import { computeAvailableStartTimes } from "./computeAvailableStartTimes";

const baseParams = {
  breaks: [],
  busy: [],
  bufferMin: 0,
};

test("기본 영업시간에서 15분 단위 슬롯을 생성한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "10:00" }],
    durationMin: 30,
    stepMin: 15,
  });

  assert.deepEqual(result, ["09:00", "09:15", "09:30"]);
});

test("예약 종료가 영업 종료와 정확히 같으면 포함한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "18:00" }],
    durationMin: 60,
    stepMin: 15,
  });

  assert.equal(result.includes("17:00"), true);
  assert.equal(result.includes("17:15"), false);
});

test("buffer가 영업 종료를 넘어가도 duration이 영업시간 안이면 포함한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "18:00" }],
    durationMin: 60,
    bufferMin: 30,
    stepMin: 15,
  });

  assert.equal(result.includes("17:00"), true);
});

test("휴게시간과 겹치는 슬롯을 제외한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    breaks: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: 15,
  });

  assert.equal(result.includes("09:45"), false);
  assert.equal(result.includes("10:00"), false);
  assert.equal(result.includes("10:45"), false);
});

test("휴게 종료 시각과 예약 시작 시각이 같으면 허용한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    breaks: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: 15,
  });

  assert.equal(result.includes("11:00"), true);
});

test("기존 예약과 겹치는 슬롯을 제외한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    busy: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: 15,
  });

  assert.equal(result.includes("09:45"), false);
  assert.equal(result.includes("10:00"), false);
  assert.equal(result.includes("10:45"), false);
});

test("기존 예약 종료 시각과 새 예약 시작 시각이 같으면 허용한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "12:00" }],
    busy: [{ start: "10:00", end: "11:00" }],
    durationMin: 30,
    stepMin: 15,
  });

  assert.equal(result.includes("11:00"), true);
});

test("workWindows가 빈 배열이면 빈 결과를 반환한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [],
    durationMin: 30,
    stepMin: 15,
  });

  assert.deepEqual(result, []);
});

test("notBefore보다 이전 슬롯을 제외한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "10:00" }],
    durationMin: 15,
    stepMin: 15,
    notBefore: "09:30",
  });

  assert.deepEqual(result, ["09:30", "09:45"]);
});

test("notBefore가 슬롯 사이에 있으면 다음 슬롯부터 허용한다", () => {
  const result = computeAvailableStartTimes({
    ...baseParams,
    workWindows: [{ start: "09:00", end: "10:00" }],
    durationMin: 15,
    stepMin: 15,
    notBefore: "09:10",
  });

  assert.deepEqual(result, ["09:15", "09:30", "09:45"]);
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

test.todo("stepMin이 0 이하이면 무한 반복을 피하도록 입력 검증이 필요하다");
