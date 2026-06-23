import { redirect } from "next/navigation";
import { getOnboardingBootstrapState } from "@/features/onboarding/bootstrapState";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OnboardingBootstrapRetry from "./OnboardingBootstrapRetry";
import OnboardingFlow from "./OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[onboarding] user check failed", {
      hasUserId: Boolean(user?.id),
      message: userError?.message ?? "not authenticated",
    });
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  const organizationId =
    typeof membership?.organization_id === "string" ? membership.organization_id : null;

  const bootstrapState = getOnboardingBootstrapState({
    userId: user.id,
    organizationId,
  });

  if (membershipError || bootstrapState === "retry") {
    console.error("[onboarding] missing organization; rendering bootstrap retry", {
      source: "onboarding",
      userId: user.id,
      email: user.email ?? null,
      message: membershipError?.message ?? "owner organization not found",
      code: membershipError?.code ?? null,
      details: membershipError?.details ?? null,
      hint: membershipError?.hint ?? null,
    });

    return <OnboardingBootstrapRetry />;
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

  if (organizationResult.error || !organization) {
    console.error("[onboarding] missing organization; rendering bootstrap retry", {
      source: "onboarding",
      userId: user.id,
      email: user.email ?? null,
      organizationId,
      message: organizationResult.error?.message ?? "organization row not found",
      code: organizationResult.error?.code ?? null,
      details: organizationResult.error?.details ?? null,
      hint: organizationResult.error?.hint ?? null,
    });

    return <OnboardingBootstrapRetry />;
  }

  const services = serviceResult.data ?? [];
  const availability = availabilityResult.data ?? [];

  return (
    <OnboardingFlow
      initialName={(organization?.name as string | null) ?? ""}
      initialLocation={(organization?.location_text as string | null) ?? ""}
      initialNotice={(organization?.notice_text as string | null) ?? ""}
      initialHandle={(organization.handle as string | null) ?? ""}
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
