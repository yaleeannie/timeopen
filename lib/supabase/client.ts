// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

// ✅ 브라우저(클라이언트 컴포넌트) 전용 supabase client 생성 함수
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ✅ 기존 코드가 supabase 싱글톤을 쓰고 있었다면 호환용으로 유지
export const supabase = createSupabaseBrowserClient();