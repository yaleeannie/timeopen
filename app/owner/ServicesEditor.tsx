"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  organizationId: string;
};

type ServiceRow = {
  id: string;
  name: string;
  duration_min: number;
  price: number | null;
  active: boolean;
};

export default function ServicesEditor({ organizationId }: Props) {
  const supabase = createSupabaseBrowserClient();

  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDurationMin, setEditDurationMin] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, duration_min, price, active")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      setMsg(error.message);
      return;
    }

    setRows((data as ServiceRow[]) ?? []);
  }

  useEffect(() => {
    void load();
  }, [organizationId]);

  async function addService() {
    setMsg("");

    if (!name.trim()) {
      setMsg("서비스명을 입력해주세요.");
      return;
    }

    const duration = Number(durationMin);
    if (!duration || duration <= 0) {
      setMsg("소요시간을 올바르게 입력해주세요.");
      return;
    }

    const { error } = await supabase.from("services").insert({
      organization_id: organizationId,
      name: name.trim(),
      duration_min: duration,
      price: price.trim() ? Number(price) : null,
      active: true,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setName("");
    setDurationMin("");
    setPrice("");
    setMsg("저장되었습니다.");
    await load();
  }

  function startEdit(row: ServiceRow) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditDurationMin(String(row.duration_min));
    setEditPrice(row.price != null ? String(row.price) : "");
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDurationMin("");
    setEditPrice("");
  }

  async function saveEdit(id: string) {
    setMsg("");

    if (!editName.trim()) {
      setMsg("서비스명을 입력해주세요.");
      return;
    }

    const duration = Number(editDurationMin);
    if (!duration || duration <= 0) {
      setMsg("소요시간을 올바르게 입력해주세요.");
      return;
    }

    const { error } = await supabase
      .from("services")
      .update({
        name: editName.trim(),
        duration_min: duration,
        price: editPrice.trim() ? Number(editPrice) : null,
      })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("수정되었습니다.");
    cancelEdit();
    await load();
  }

  async function toggleActive(row: ServiceRow) {
    setMsg("");

    const { error } = await supabase
      .from("services")
      .update({ active: !row.active })
      .eq("id", row.id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg(row.active ? "비활성화되었습니다." : "활성화되었습니다.");
    await load();
  }

  async function deleteService(id: string) {
    const ok = window.confirm("이 서비스를 삭제할까요?");
    if (!ok) return;

    setMsg("");

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      setMsg(`삭제 실패: ${error.message}`);
      return;
    }

    setMsg("삭제되었습니다.");
    if (editingId === id) {
      cancelEdit();
    }
    await load();
  }

  return (
    <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 12 }}>서비스 관리</div>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>서비스명</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 커트"
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>소요시간 (분)</div>
          <input
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            placeholder="예: 30"
            inputMode="numeric"
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>가격 (원, 선택)</div>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 30000"
            inputMode="numeric"
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          />
        </div>

        <button
          type="button"
          onClick={addService}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: 800,
            width: "fit-content",
          }}
        >
          서비스 저장
        </button>
      </div>

      {msg ? <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700 }}>{msg}</div> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((row) => {
          const isEditing = editingId === row.id;

          return (
            <div
              key={row.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
              }}
            >
              {isEditing ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>서비스명</div>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="서비스명"
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>소요시간 (분)</div>
                    <input
                      value={editDurationMin}
                      onChange={(e) => setEditDurationMin(e.target.value)}
                      placeholder="소요시간(분)"
                      inputMode="numeric"
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>가격 (원, 선택)</div>
                    <input
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="가격"
                      inputMode="numeric"
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => saveEdit(row.id)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #111",
                        background: "#111",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        background: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{row.name}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {row.duration_min}분 {row.price != null ? `· ${row.price.toLocaleString()}원` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: row.active ? "#111" : "#999" }}>
                      {row.active ? "활성" : "비활성"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {row.active ? "비활성화" : "활성화"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteService(row.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#fff",
                        fontWeight: 700,
                        color: "#b00020",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}