import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bootstrapOwner } from "@/lib/owner/bootstrapOwner";

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

  const { organizationId, handle, error } = await bootstrapOwner(
    supabase,
    { id: user.id, email: user.email },
    "getOwnerContext"
  );

  return {
    user,
    organizationId,
    handle,
    error,
  };
}
