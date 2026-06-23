export const PLAN_TYPES = ["beta", "trial", "paid", "free", "canceled"] as const;
export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
] as const;

export type PlanType = (typeof PLAN_TYPES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type OrganizationPlanFields = {
  plan_type?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  beta_ends_at?: string | null;
  billing_starts_at?: string | null;
};

export type PlanDisplay = {
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  label: string;
  helperText: string;
  billingNotice: string;
};

export function isPlanType(value: unknown): value is PlanType {
  return typeof value === "string" && PLAN_TYPES.includes(value as PlanType);
}

export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return (
    typeof value === "string" &&
    SUBSCRIPTION_STATUSES.includes(value as SubscriptionStatus)
  );
}

export function normalizePlanType(value: unknown): PlanType {
  return isPlanType(value) ? value : "beta";
}

export function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  return isSubscriptionStatus(value) ? value : "active";
}

export function getPlanDisplay(fields: OrganizationPlanFields): PlanDisplay {
  const planType = normalizePlanType(fields.plan_type);
  const subscriptionStatus = normalizeSubscriptionStatus(fields.subscription_status);

  if (subscriptionStatus === "canceled" || planType === "canceled") {
    return {
      planType: "canceled",
      subscriptionStatus,
      label: "이용 종료",
      helperText: "현재 이용이 종료된 상태예요. 다시 사용하려면 문의해주세요.",
      billingNotice: "자동 결제는 진행되지 않아요.",
    };
  }

  if (planType === "trial") {
    return {
      planType,
      subscriptionStatus,
      label: "무료 체험 중",
      helperText:
        "무료 체험 기간이 끝나기 전에 유료 플랜 전환 여부를 안내드릴게요.",
      billingNotice: "동의 없이 자동으로 유료 결제되지 않아요.",
    };
  }

  if (planType === "paid") {
    return {
      planType,
      subscriptionStatus,
      label: "유료 이용 중",
      helperText: "현재 유료 플랜으로 TimeOpen을 이용 중이에요.",
      billingNotice: "결제 관련 변경은 별도 안내 후 진행돼요.",
    };
  }

  if (planType === "free") {
    return {
      planType,
      subscriptionStatus,
      label: "무료 플랜",
      helperText: "현재 무료 플랜으로 TimeOpen을 이용 중이에요.",
      billingNotice: "자동 결제는 진행되지 않아요.",
    };
  }

  return {
    planType: "beta",
    subscriptionStatus,
    label: "베타 이용 중",
    helperText:
      "초기 베타 기간에는 무료로 사용할 수 있어요. 정식 유료 전환 전 별도로 안내드릴게요.",
    billingNotice: "기존 베타 사용자는 사전 안내 없이 자동 결제되지 않아요.",
  };
}
