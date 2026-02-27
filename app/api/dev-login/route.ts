// 개발 전용 로그인 (메일 안 보냄)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 이미 존재하는 유저 이메일
  const { data, error } = await supabase.auth.signInWithOtp({
    email: "yaleeannie@gmail.com",
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/owner`
  );
}