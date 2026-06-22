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
      className="brand-outline min-h-11 shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold shadow-sm transition"
    >
      로그아웃
    </button>
  );
}
