import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profileEditor = readFileSync(
  new URL("../../app/owner/ProfileEditor.tsx", import.meta.url),
  "utf8"
);

test("booking link profile section uses short default helper copy", () => {
  assert.match(profileEditor, /인스타 프로필에 복사할 예약 링크예요\./);
  assert.doesNotMatch(
    profileEditor,
    /인스타 프로필에 복사할 주소예요\. 영어 소문자/
  );
});

test("booking link long guidance is behind a collapsible toggle", () => {
  assert.match(profileEditor, /handleGuidanceOpen/);
  assert.match(profileEditor, /예약 링크 변경 안내 보기/);
  assert.match(profileEditor, /예약 링크 변경 안내 닫기/);
  assert.match(profileEditor, /\{handleGuidanceOpen \? \(/);
  assert.match(
    profileEditor,
    /예약 링크는 14일에 한 번만 변경할 수 있어요\./
  );
});

test("active handle cooldown warning remains visible outside guidance", () => {
  const cooldownIndex = profileEditor.indexOf("handleCooldownActive");
  const linkPreviewIndex = profileEditor.indexOf("getBookingUrl(handle)");
  assert.ok(cooldownIndex > -1);
  assert.ok(linkPreviewIndex > -1);
  assert.ok(cooldownIndex < linkPreviewIndex);
  assert.doesNotMatch(
    profileEditor,
    /※ 변경 시 기존 링크는 더 이상 사용되지 않을 수 있어요/
  );
});
