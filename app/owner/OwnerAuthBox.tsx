"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OwnerAuthBox() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  async function refreshMe() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    } catch {
      setUserEmail(null);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut().catch(() => {});
    window.location.reload();
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        border: "1px solid #e5e5e5",
        borderRadius: 12,
        background: "#fff",
        color: "#111",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
        owner 기능은 로그인 후 사용 가능해요.
      </div>

      {userEmail ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            로그인됨: <span style={{ fontWeight: 900 }}>{userEmail}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="/login"
            style={{
              display: "inline-block",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            로그인하기
          </a>

          <a
            href="/signup"
            style={{
              display: "inline-block",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #cfcfcf",
              background: "#fff",
              color: "#111",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            회원가입
          </a>
        </div>
      )}
    </div>
  );
}