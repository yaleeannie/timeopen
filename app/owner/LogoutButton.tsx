"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  async function onLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="min-h-11 shrink-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-sm font-bold text-[#5594a3] shadow-sm transition hover:bg-[#f2fbfc] hover:text-[#287f94]"
    >
      로그아웃
    </button>
  );
}
