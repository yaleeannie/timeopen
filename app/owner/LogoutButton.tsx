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
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #111",
        background: "#111",
        color: "#fff",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      로그아웃
    </button>
  );
}