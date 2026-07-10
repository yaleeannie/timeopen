import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const popupSource = readFileSync(
  new URL("../../app/owner/OwnerWhatsNewPopup.tsx", import.meta.url),
  "utf8"
);
const ownerPageSource = readFileSync(
  new URL("../../app/owner/page.tsx", import.meta.url),
  "utf8"
);
const reservationsPageSource = readFileSync(
  new URL("../../app/reservations/page.tsx", import.meta.url),
  "utf8"
);
const publicBookingPageSource = readFileSync(
  new URL("../../app/u/[handle]/page.tsx", import.meta.url),
  "utf8"
);

test("owner what's new popup is versioned and reads localStorage only after mount", () => {
  assert.match(popupSource, /OWNER_WHATS_NEW_STORAGE_KEY = "timeopen-whats-new-2026-07-10"/);
  assert.match(popupSource, /const \[mounted, setMounted\] = useState\(false\)/);
  assert.match(popupSource, /setMounted\(true\)/);
  assert.match(popupSource, /window\.localStorage\.getItem\(OWNER_WHATS_NEW_STORAGE_KEY\)/);
  assert.match(popupSource, /if \(!mounted \|\| !open\) return null/);
});

test("owner what's new popup dismisses only on user action and stores the version key", () => {
  assert.match(popupSource, /function dismiss|const dismiss = useCallback/);
  assert.match(
    popupSource,
    /window\.localStorage\.setItem\(OWNER_WHATS_NEW_STORAGE_KEY, "dismissed"\)/
  );
  assert.match(popupSource, /확인했어요/);
  assert.match(popupSource, /aria-label="업데이트 안내 닫기"/);
  assert.match(popupSource, /event\.key === "Escape"/);
  assert.doesNotMatch(popupSource, /setItem\(OWNER_WHATS_NEW_STORAGE_KEY[\s\S]+setMounted\(true\)/);
});

test("owner what's new popup includes the update content", () => {
  assert.match(popupSource, /TimeOpen이 더 편해졌어요 ✨/);
  assert.match(popupSource, /샵 운영에 꼭 필요한 기능들이 새로 추가됐어요\./);
  assert.match(popupSource, /예약 시간 단위 설정/);
  assert.match(popupSource, /10분·15분·30분·1시간/);
  assert.match(popupSource, /직접 예약 추가/);
  assert.match(popupSource, /전화나 DM으로 받은 예약/);
  assert.match(popupSource, /시간 막기/);
  assert.match(popupSource, /개인 일정이나 쉬는 시간/);
});

test("owner what's new popup uses accessible light TimeOpen modal styling", () => {
  assert.match(popupSource, /role="dialog"/);
  assert.match(popupSource, /aria-modal="true"/);
  assert.match(popupSource, /aria-labelledby="owner-whats-new-title"/);
  assert.match(popupSource, /bg-slate-900\/10/);
  assert.match(popupSource, /border border-sky-100 bg-white/);
  assert.match(popupSource, /rounded-3xl/);
  assert.match(popupSource, /bg-\[#00c9ff\]/);
});

test("owner what's new popup is mounted on authenticated owner pages, not public booking", () => {
  assert.match(ownerPageSource, /OwnerWhatsNewPopup/);
  assert.match(reservationsPageSource, /OwnerWhatsNewPopup/);
  assert.doesNotMatch(publicBookingPageSource, /OwnerWhatsNewPopup/);
});

test("owner what's new popup does not add a database migration", () => {
  const migrationNames = readdirSync(
    new URL("../../supabase/migrations", import.meta.url)
  );
  assert.equal(
    migrationNames.some((name) => /whats[-_]?new|what[-_]?s[-_]?new/i.test(name)),
    false
  );
});
