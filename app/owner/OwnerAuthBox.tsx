"use client";

import { useEffect, useMemo, useState } from "react";

const COOLDOWN_MS = 60_000; // 60초
const STORAGE_KEY = "timeopen_magiclink_last_sent_at";

export default function OwnerAuthBox() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [cooldownLeft, setCooldownLeft] = useState(0);

  // 로그인 상태 가져오기
  async function refreshMe() {
    const res = await fetch("/api/auth/me", { method: "GET" });
    const json = await res.json();
    setUserEmail(json?.user?.email ?? null);
  }

  // 쿨다운 타이머
  useEffect(() => {
    refreshMe();

    const tick = () => {
      const last = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
      const left = Math.max(0, COOLDOWN_MS - (Date.now() - last));
      setCooldownLeft(left);
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  const canSend = useMemo(() => !sending && cooldownLeft === 0, [sending, cooldownLeft]);

  async function sendMagicLink() {
    const e = email.trim().toLowerCase();
    if (!e) {
      setMsg("이메일을 입력해줘.");
      return;
    }
    if (!canSend) return;

    setSending(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const json = await res.json();

      if (!res.ok) {
        // rate limit이면 여기로 떨어짐
        setMsg(json?.error ?? "메일 전송 실패");
        return;
      }

      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setMsg("메일 보냈어! 메일함에서 링크를 누르면 자동으로 로그인돼.");
    } catch {
      setMsg("네트워크 오류. 잠시 후 다시 시도해줘.");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    setMsg("");
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshMe();
    setMsg("로그아웃 완료");
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        border: "1px solid #eee",
        borderRadius: 12,
        background: "#fafafa",
      }}
    >
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
        owner 기능은 로그인 후 사용 가능해요.
      </div>

      {userEmail ? (
        <div
            style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            }}
        >
            <div
            style={{
                fontSize: 14,
                color: "#111",          // ✅ 글씨 진하게
                fontWeight: 500,
            }}
            >
            로그인됨: <b>{userEmail}</b>
            </div>

            <button
            type="button"
            onClick={logout}
            style={{
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",          // ✅ 버튼 글씨도 진하게
                cursor: "pointer",
            }}
            >
            로그아웃
            </button>
        </div>
        ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner 이메일 입력"
            style={{
              minWidth: 260,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={!canSend}
            style={{
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              opacity: canSend ? 1 : 0.6,
              cursor: canSend ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}
          >
            {sending ? "보내는 중..." : cooldownLeft > 0 ? `잠시만 (${Math.ceil(cooldownLeft / 1000)}s)` : "로그인 메일 보내기"}
          </button>
        </div>
      )}

      {msg && <div style={{ marginTop: 10, fontSize: 13, color: "#444" }}>{msg}</div>}
      {!userEmail && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          • 메일에서 링크를 누르면 자동으로 로그인되고 <code>/owner</code>로 돌아와야 해.
        </div>
      )}
    </div>
  );
}