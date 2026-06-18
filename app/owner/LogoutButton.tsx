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
      className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
    >
      로그아웃
    </button>
  );
}
