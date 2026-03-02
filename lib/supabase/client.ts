// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(url, anon);
}

/**
 * ✅ 기존 코드 호환용: named export supabase 유지
 * - 여러 feature 파일이 `import { supabase } ...` 형태를 쓰고 있어서
 * - 이 export가 없으면 Turbopack이 빌드 단계에서 즉시 터짐
 *
 * 주의:
 * - 이 모듈은 "클라이언트에서만" 쓰는 파일들이 import해야 안전함.
 * - (서버에서 써야 할 때는 lib/supabase/server.ts 사용)
 */
export const supabase = createSupabaseBrowserClient();