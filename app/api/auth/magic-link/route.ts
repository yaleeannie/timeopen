// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // 🔓 누구나 로그인 가능 (온보딩 자동화 테스트 단계)
  return NextResponse.json({ ok: true });
}