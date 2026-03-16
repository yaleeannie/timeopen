import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOwnerContext() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return {
      user: null,
      organizationId: null,
      handle: null,
      error: "로그인이 필요합니다.",
    };
  }

  const { data: boot, error: bootErr } = await supabase.rpc("bootstrap_owner");

  if (bootErr) {
    return {
      user,
      organizationId: null,
      handle: null,
      error: bootErr.message,
    };
  }

  const row = Array.isArray(boot) ? boot[0] : boot;

  return {
    user,
    organizationId: (row?.organization_id as string | null) ?? null,
    handle: (row?.handle as string | null) ?? null,
    error: null,
  };
}