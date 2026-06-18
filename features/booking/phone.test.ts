import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePhoneToE164,
  type SupportedPhoneCountry,
} from "./phone";

function assertNormalizes(
  country: SupportedPhoneCountry,
  inputs: string[],
  expected: string
) {
  for (const input of inputs) {
    assert.deepEqual(normalizePhoneToE164(country, input), {
      ok: true,
      e164: expected,
    });
  }
}

test("한국 휴대전화 번호를 E.164로 정규화한다", () => {
  assertNormalizes(
    "KR",
    [
      "010-1234-5678",
      "01012345678",
      "(010) 1234-5678",
      "+82 10 1234 5678",
      "82-10-1234-5678",
    ],
    "+821012345678"
  );
});

test("한국 국가번호 뒤에 남은 국내용 0을 한 번 제거해 보정한다", () => {
  assertNormalizes(
    "KR",
    ["+8201012345678", "82 (0)10-1234-5678"],
    "+821012345678"
  );
});

test("일본 휴대전화 번호를 E.164로 정규화한다", () => {
  assertNormalizes(
    "JP",
    [
      "090-1234-5678",
      "(090) 1234-5678",
      "+81 90 1234 5678",
      "819012345678",
    ],
    "+819012345678"
  );
});

test("미국 번호를 E.164로 정규화한다", () => {
  assertNormalizes(
    "US",
    [
      "415-555-2671",
      "(415) 555-2671",
      "+1 415 555 2671",
      "1-415-555-2671",
    ],
    "+14155552671"
  );
});

test("캐나다 번호를 E.164로 정규화한다", () => {
  assertNormalizes(
    "CA",
    ["416-555-0123", "+1 (416) 555-0123", "1 416 555 0123"],
    "+14165550123"
  );
});

test("태국 휴대전화 번호를 E.164로 정규화한다", () => {
  assertNormalizes(
    "TH",
    [
      "081-234-5678",
      "(081) 234-5678",
      "+66 81 234 5678",
      "66812345678",
      "+660812345678",
    ],
    "+66812345678"
  );
});

test("중국 휴대전화 번호를 E.164로 정규화한다", () => {
  assertNormalizes(
    "CN",
    ["138 0013 8000", "138-0013-8000", "+86 138 0013 8000", "8613800138000"],
    "+8613800138000"
  );
});

test("선택 국가와 다른 국가번호는 실패한다", () => {
  assert.deepEqual(normalizePhoneToE164("KR", "+81 90 1234 5678"), {
    ok: false,
    error: "INVALID_PHONE",
  });
  assert.deepEqual(normalizePhoneToE164("US", "+82 10 1234 5678"), {
    ok: false,
    error: "INVALID_PHONE",
  });
});

test("문자나 허용하지 않은 기호가 섞이면 실패한다", () => {
  for (const input of ["abc", "010-1234-ABCD", "010.1234.5678", "+82/10/1234/5678"]) {
    assert.deepEqual(normalizePhoneToE164("KR", input), {
      ok: false,
      error: "INVALID_PHONE",
    });
  }
});

test("너무 짧거나 불완전한 번호는 실패한다", () => {
  for (const [country, input] of [
    ["KR", "010"],
    ["JP", "090"],
    ["US", "123"],
    ["CA", "416"],
    ["TH", "081"],
    ["CN", "138"],
  ] as const) {
    assert.deepEqual(normalizePhoneToE164(country, input), {
      ok: false,
      error: "INVALID_PHONE",
    });
  }
});

test("잘못된 plus 위치나 중복 plus는 실패한다", () => {
  for (const input of ["82+1012345678", "++821012345678", "+82+1012345678"]) {
    assert.deepEqual(normalizePhoneToE164("KR", input), {
      ok: false,
      error: "INVALID_PHONE",
    });
  }
});

test("국가별 휴대전화 패턴에 맞지 않으면 실패한다", () => {
  const invalidCases: Array<[SupportedPhoneCountry, string]> = [
    ["KR", "020-1234-5678"],
    ["JP", "050-1234-5678"],
    ["US", "015-555-2671"],
    ["CA", "116-555-0123"],
    ["TH", "021-234-5678"],
    ["CN", "128 0013 8000"],
  ];

  for (const [country, input] of invalidCases) {
    assert.deepEqual(normalizePhoneToE164(country, input), {
      ok: false,
      error: "INVALID_PHONE",
    });
  }
});
