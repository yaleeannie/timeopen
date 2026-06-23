"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { createOrganization } from "@/features/organizations/createOrganization";

function normalizeHandle(v: string) {
  return v.trim().toLowerCase();
}

function isValidHandle(v: string) {
  // a-z, 0-9, underscore, dash / 3~20자
  return /^[a-z0-9_-]{3,20}$/.test(v);
}

export default function CreateOrganizationPage() {
  const router = useRouter();

  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanHandle = useMemo(() => normalizeHandle(handle), [handle]);
  const valid = useMemo(() => isValidHandle(cleanHandle), [cleanHandle]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!valid) {
      setErrorMsg("handle 형식이 올바르지 않습니다. (3~20자, a-z0-9_-)");
      return;
    }

    setSubmitting(true);
    try {
      await createOrganization(cleanHandle);
      router.replace(`/u/${cleanHandle}`);
    } catch (err: any) {
      // supabase 에러(중복 등) 메시지 최소 처리
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "생성에 실패했습니다.";
      setErrorMsg(msg);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="인스타 예약 링크를 만들어요"
      description="인스타 프로필에 올릴 샵 전용 예약 주소를 설정해주세요."
      eyebrow="TimeOpen 시작하기"
    >
        <form onSubmit={onSubmit}>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Handle</label>

          <div>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. timeopen"
              className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <p className="brand-soft mt-3 rounded-xl px-3 py-2.5 text-sm font-medium">
            미리보기: <span className="font-mono font-bold">/u/{cleanHandle || "handle"}</span>
          </p>

          {errorMsg && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
            className="brand-button mt-5 min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </form>
    </AuthShell>
  );
}
