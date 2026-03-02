// app/api/auth/magic-link/route.ts

export async function POST(req: Request) {
  const { email } = await req.json();

  const owners = parseOwnerEmails(process.env.OWNER_EMAILS);
  const e = normalizeEmail(email);

  if (!owners.includes(e)) {
    return NextResponse.json({ error: "허용되지 않은 이메일입니다." }, { status: 403 });
  }

  // ❌ 여기서 Supabase 호출 절대 하면 안됨
  // PKCE 깨짐

  return NextResponse.json({ ok: true });
}