export type OnboardingBootstrapState = "ready" | "retry";

export function getOnboardingBootstrapState({
  userId,
  organizationId,
}: {
  userId: string | null | undefined;
  organizationId: string | null | undefined;
}): OnboardingBootstrapState {
  if (userId && !organizationId) return "retry";
  return "ready";
}
