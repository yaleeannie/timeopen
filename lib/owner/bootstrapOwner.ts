import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type BootstrapOwnerResult = {
  organizationId: string | null;
  handle: string | null;
  error: string | null;
};

export type BootstrapOwnerRpcRow = {
  organization_id?: unknown;
  handle?: unknown;
};

export function parseBootstrapOwnerRpcResult(data: unknown):
  | { ok: true; organizationId: string; handle: string | null }
  | { ok: false; error: string } {
  const row = Array.isArray(data) ? data[0] : data;

  if (!row || typeof row !== "object") {
    return { ok: false, error: "bootstrap_owner returned empty result" };
  }

  const typedRow = row as BootstrapOwnerRpcRow;
  const organizationId =
    typeof typedRow.organization_id === "string" ? typedRow.organization_id : null;
  const handle = typeof typedRow.handle === "string" ? typedRow.handle : null;

  if (!organizationId) {
    return { ok: false, error: "bootstrap_owner returned no organization_id" };
  }

  return { ok: true, organizationId, handle };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultHandle(userId: string) {
  return `shop-${userId.replace(/-/g, "").slice(0, 10)}`;
}

export async function bootstrapOwner(
  supabase: SupabaseServerClient,
  user: { id: string; email?: string | null },
  source: string
): Promise<BootstrapOwnerResult> {
  console.log(`[${source}] bootstrap start`, {
    hasUserId: Boolean(user.id),
    userId: user.id,
    email: user.email ?? null,
  });

  const { data: existingMembership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (membershipError) {
    console.error(`[${source}] existing organization lookup failed`, {
      userId: user.id,
      message: membershipError.message,
      code: membershipError.code,
    });
  } else {
    console.log(`[${source}] existing organization lookup`, {
      userId: user.id,
      organizationId: existingMembership?.organization_id ?? null,
    });
  }

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { data, error } = await supabase.rpc("bootstrap_owner");

    if (error) {
      lastError = error.message;
      console.error("[bootstrap] rpc failed", {
        source,
        attempt,
        userId: user.id,
        email: user.email ?? null,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      console.error(`[${source}] bootstrap_owner failed`, {
        attempt,
        userId: user.id,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        possibleRlsFailure:
          error.message.toLowerCase().includes("row-level security") ||
          error.message.toLowerCase().includes("permission denied"),
      });

      if (attempt < 3) {
        await wait(attempt * 150);
      }
      continue;
    }

    const parsed = parseBootstrapOwnerRpcResult(data);

    console.log(`[${source}] bootstrap_owner result`, {
      attempt,
      userId: user.id,
      email: user.email ?? null,
      organizationId: parsed.ok ? parsed.organizationId : null,
      handle: parsed.ok ? parsed.handle : null,
      returnedEmpty: !parsed.ok,
    });

    if (!parsed.ok) {
      lastError = parsed.error;
      console.error("[bootstrap] result empty", {
        source,
        attempt,
        userId: user.id,
        email: user.email ?? null,
        error: parsed.error,
        data,
      });
      console.error(`[${source}] organization creation returned empty`, {
        attempt,
        userId: user.id,
        row: data ?? null,
      });

      if (attempt < 3) {
        await wait(attempt * 150);
      }
      continue;
    }

    const organizationId = parsed.organizationId;
    let handle = parsed.handle;

    if (!handle) {
      const baseHandle = defaultHandle(user.id);

      for (let suffix = 0; suffix < 3; suffix += 1) {
        const candidate = suffix === 0 ? baseHandle : `${baseHandle}-${suffix + 1}`;
        const { data: handleData, error: handleError } = await supabase.rpc("set_my_handle", {
          p_handle: candidate,
        });

        if (handleError) {
          console.error(`[${source}] default handle save failed`, {
            userId: user.id,
            organizationId,
            candidate,
            message: handleError.message,
            code: handleError.code,
          });
          continue;
        }

        const handleRow = Array.isArray(handleData) ? handleData[0] : handleData;
        handle = (handleRow?.handle as string | null) ?? candidate;
        console.log(`[${source}] default handle saved`, {
          userId: user.id,
          organizationId,
          handle,
        });
        break;
      }

      if (!handle) {
        console.error(`[${source}] handle setup skipped after retries`, {
          userId: user.id,
          organizationId,
        });
      }
    }

    console.log("[bootstrap] success", {
      source,
      attempt,
      userId: user.id,
      email: user.email ?? null,
      organizationId,
      handle,
    });

    return { organizationId, handle, error: null };
  }

  const { data: recoveredMembership, error: recoveryMembershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (recoveryMembershipError) {
    console.error(`[${source}] owner context recovery failed`, {
      userId: user.id,
      message: recoveryMembershipError.message,
      code: recoveryMembershipError.code,
    });
  }

  if (recoveredMembership?.organization_id) {
    const { data: recoveredOrganization, error: recoveryOrganizationError } = await supabase
      .from("organizations")
      .select("id, handle")
      .eq("id", recoveredMembership.organization_id)
      .maybeSingle();

    if (recoveryOrganizationError) {
      console.error(`[${source}] organization recovery failed`, {
        userId: user.id,
        organizationId: recoveredMembership.organization_id,
        message: recoveryOrganizationError.message,
        code: recoveryOrganizationError.code,
      });
    } else if (recoveredOrganization?.id) {
      console.log(`[${source}] recovered existing owner context`, {
        userId: user.id,
        organizationId: recoveredOrganization.id,
        handle: recoveredOrganization.handle ?? null,
      });
      console.log("[bootstrap] success", {
        source,
        recovered: true,
        userId: user.id,
        email: user.email ?? null,
        organizationId: recoveredOrganization.id,
        handle: recoveredOrganization.handle ?? null,
      });

      return {
        organizationId: String(recoveredOrganization.id),
        handle: (recoveredOrganization.handle as string | null) ?? null,
        error: null,
      };
    }
  }

  console.error(`[${source}] bootstrap exhausted`, {
    userId: user.id,
    existingOrganizationId: existingMembership?.organization_id ?? null,
    membershipLookupError: membershipError?.message ?? null,
    lastError,
  });
  console.error("[bootstrap] result empty", {
    source,
    userId: user.id,
    email: user.email ?? null,
    existingOrganizationId: existingMembership?.organization_id ?? null,
    lastError,
  });

  return {
    organizationId: null,
    handle: null,
    error: lastError ?? "초기 설정 정보를 만들지 못했습니다.",
  };
}
