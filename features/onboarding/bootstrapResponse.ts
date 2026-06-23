export type BootstrapApiSuccess = {
  ok: true;
  organizationId: string;
  handle: string | null;
};

export function isBootstrapApiSuccess(value: unknown): value is BootstrapApiSuccess {
  if (!value || typeof value !== "object") return false;

  const response = value as {
    ok?: unknown;
    organizationId?: unknown;
    handle?: unknown;
  };

  return (
    response.ok === true &&
    typeof response.organizationId === "string" &&
    (typeof response.handle === "string" || response.handle === null)
  );
}
