"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Create Organization</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block text-sm font-medium">Handle</label>

          <div className="flex items-center gap-2">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. timeopen"
              className="w-full rounded-md border px-3 py-2"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <p className="text-sm text-gray-600">
            미리보기: <span className="font-mono">/u/{cleanHandle || "handle"}</span>
          </p>

          {errorMsg && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </main>
  );
}