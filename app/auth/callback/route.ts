// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/owner";

  // redirect 응답을 먼저 만들어두고, 여기에 쿠키를 실어보낸다(중요)
  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // code가 없으면 그냥 next로 보냄
  if (!code) return response;

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // 실패 이유를 URL에 실어서 바로 보이게(디버깅 편하게)
  if (error) {
    const fail = new URL("/owner", url.origin);
    fail.searchParams.set("auth", "fail");
    fail.searchParams.set("reason", error.message);
    return NextResponse.redirect(fail);
  }

  return response;
}