import { cookies } from "next/headers";

/**
 * TODO: 너희 기존 org 컨텍스트 방식으로 여기만 연결하면 됨.
 * 지금은 cookie organizationId 또는 개발용 env로 fallback.
 */
export async function getCurrentOrganizationId(): Promise<string> {
  const c = await cookies();
  const fromCookie = c.get("organizationId")?.value;
  const fromEnv = process.env.DEFAULT_ORGANIZATION_ID;

  const orgId = fromCookie || fromEnv;
  if (!orgId) throw new Error("Missing current organizationId (cookie organizationId)");
  return orgId;
}