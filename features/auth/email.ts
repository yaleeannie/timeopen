export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const email = normalizeEmail(value);

  if (!email || email.length > 254 || /\s/.test(email)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function validateEmail(value: string) {
  const email = normalizeEmail(value);

  if (!email) {
    return { ok: false as const, error: "이메일 주소를 입력해주세요." };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false as const,
      error: "올바른 이메일 주소를 입력해주세요.",
    };
  }

  return { ok: true as const, value: email };
}
