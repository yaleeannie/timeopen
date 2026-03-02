// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function parseOwnerEmails(env?: string | null) {
  return (env ?? "")
    .split(",")
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
}

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const owners = parseOwnerEmails(process.env.OWNER_EMAILS);
  const e = normalizeEmail(email);

  if (owners.length === 0) {
    return NextResponse.json({ error: "OWNER_EMAILS not set on server" }, { status: 500 });
  }

  if (!owners.includes(e)) {
    return NextResponse.json({ error: "허용되지 않은 이메일입니다. (owner 전용)" }, { status: 403 });
  }

  // ✅ 여기서는 발송하지 않고, 브라우저에서 signInWithOtp 하도록 ok만 준다
  return NextResponse.json({ ok: true });
}