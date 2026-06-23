export const DEFAULT_OWNER_ORGANIZATION_NAME = "내 샵";
export const DEFAULT_LEGACY_PLAN = "trial";
export const DEFAULT_PLAN_TYPE = "beta";
export const DEFAULT_SUBSCRIPTION_STATUS = "active";
export const DEFAULT_BOOKING_SLOT_MODE = "flexible";

export function getDefaultOwnerOrganizationPayload(handle?: string) {
  return {
    ...(handle ? { handle } : {}),
    name: DEFAULT_OWNER_ORGANIZATION_NAME,
    plan: DEFAULT_LEGACY_PLAN,
    plan_type: DEFAULT_PLAN_TYPE,
    subscription_status: DEFAULT_SUBSCRIPTION_STATUS,
    booking_slot_mode: DEFAULT_BOOKING_SLOT_MODE,
  };
}
