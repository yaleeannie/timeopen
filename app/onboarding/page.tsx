import { redirect } from "next/navigation";
import { bootstrapOwner } from "@/lib/owner/bootstrapOwner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OnboardingFlow from "./OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { organizationId, handle, error } = await bootstrapOwner(
    supabase,
    { id: user.id, email: user.email },
    "onboarding"
  );

  if (error || !organizationId) {
    return (
      <main className="flex min-h-screen items-center bg-white px-4 py-8 text-gray-950">
        <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#e2efee] bg-white p-6 text-center shadow-[0_20px_60px_rgba(80,145,164,0.12)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5e6] text-2xl font-black text-[#b7781f]">
            !
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-[-0.04em]">
            초기 설정을 준비하지 못했어요.
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 다시 로그인한 뒤 진행해 주세요.
          </p>
          <a
            href="/onboarding"
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(14,165,233,0.2)]"
          >
            다시 시도
          </a>
          <a
            href="/login"
            className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-[#168ca8]"
          >
            로그인으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  const [organizationResult, serviceResult, availabilityResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, handle, location_text, notice_text")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("services")
      .select("id, name, duration_min, price")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("organization_availability")
      .select("weekday, is_open, work_start, work_end, break_start, break_end")
      .eq("organization_id", organizationId)
      .order("weekday", { ascending: true }),
  ]);

  const organization = organizationResult.data;
  const services = serviceResult.data ?? [];
  const availability = availabilityResult.data ?? [];

  return (
    <OnboardingFlow
      initialName={(organization?.name as string | null) ?? ""}
      initialLocation={(organization?.location_text as string | null) ?? ""}
      initialNotice={(organization?.notice_text as string | null) ?? ""}
      initialHandle={(organization?.handle as string | null) ?? handle ?? ""}
      initialServices={services.map((service) => ({
        id: String(service.id),
        name: String(service.name ?? ""),
        durationMin: Number(service.duration_min ?? 0),
        price: service.price == null ? null : Number(service.price),
      }))}
      initialAvailability={availability.map((row) => ({
        weekday: Number(row.weekday),
        isOpen: Boolean(row.is_open),
        startTime: row.work_start?.slice(0, 5) ?? "09:00",
        endTime: row.work_end?.slice(0, 5) ?? "18:00",
        breakStartTime: row.break_start?.slice(0, 5) ?? "",
        breakEndTime: row.break_end?.slice(0, 5) ?? "",
      }))}
    />
  );
}
