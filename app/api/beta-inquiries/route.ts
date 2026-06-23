import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateBetaInquiry } from "@/features/betaInquiry/validation";
import { notifyAdminBetaInquiry } from "@/features/betaInquiry/notifyAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const validation = validateBetaInquiry({
    name: body?.name,
    contact: body?.contact,
    shop_name: body?.shop_name,
    shop_type: body?.shop_type,
    current_booking_method: body?.current_booking_method,
    pain_point: body?.pain_point,
    monthly_booking_volume: body?.monthly_booking_volume,
    message: body?.message,
  });

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("beta_inquiries").insert(validation.value);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await notifyAdminBetaInquiry(validation.value);
  } catch (emailError) {
    console.error("[beta-inquiries] admin email notification failed", emailError);
  }

  return NextResponse.json({ ok: true });
}
