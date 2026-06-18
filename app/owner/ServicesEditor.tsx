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
    <section className="min-w-0">
      <div className="mb-6 rounded-[24px] bg-gradient-to-br from-[#58dfbe] to-[#2fc9a5] p-5 text-white shadow-[0_14px_30px_rgba(47,201,165,0.22)]">
        <div className="mb-4 text-lg font-black">새 서비스</div>
        <div className="grid gap-4">
        <div>
          <div className="mb-1.5 text-sm font-bold text-white/90">서비스명</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 커트"
            className="min-h-11 w-full min-w-0 rounded-xl border border-white/30 bg-white px-3 py-2.5 text-base text-gray-900 outline-none"
          />
        </div>

        <div>
          <div className="mb-1.5 text-sm font-bold text-white/90">소요시간 (분)</div>
          <input
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            placeholder="예: 30"
            inputMode="numeric"
            className="min-h-11 w-full min-w-0 rounded-xl border border-white/30 bg-white px-3 py-2.5 text-base text-gray-900 outline-none"
          />
        </div>

        <div>
          <div className="mb-1.5 text-sm font-bold text-white/90">가격 (원, 선택)</div>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 30000"
            inputMode="numeric"
            className="min-h-11 w-full min-w-0 rounded-xl border border-white/30 bg-white px-3 py-2.5 text-base text-gray-900 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={addService}
          className="min-h-11 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#22a988] shadow-sm"
        >
          서비스 저장
        </button>
        </div>
      </div>

      {msg ? <div className="mb-4 rounded-xl bg-[#eef9fb] px-4 py-3 text-sm font-bold text-[#287f94] [overflow-wrap:anywhere]">{msg}</div> : null}

      <div className="mb-3 flex items-center justify-between px-1">
        <div className="text-base font-black">서비스 목록</div>
        <div className="text-sm font-bold text-gray-400">{rows.length}개</div>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => {
          const isEditing = editingId === row.id;

          return (
            <div
              key={row.id}
              className="min-w-0 rounded-2xl border border-[#e5f3f6] bg-white p-4 shadow-sm"
            >
              {isEditing ? (
                <div className="grid gap-4">
                  <div>
                    <div className="mb-1.5 text-sm font-bold text-gray-700">서비스명</div>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="서비스명"
                      className="min-h-11 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 text-sm font-bold text-gray-700">소요시간 (분)</div>
                    <input
                      value={editDurationMin}
                      onChange={(e) => setEditDurationMin(e.target.value)}
                      placeholder="소요시간(분)"
                      inputMode="numeric"
                      className="min-h-11 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 text-sm font-bold text-gray-700">가격 (원, 선택)</div>
                    <input
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="가격"
                      inputMode="numeric"
                      className="min-h-11 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(row.id)}
                      className="min-h-11 rounded-xl bg-[#28b9dc] px-4 py-2.5 text-sm font-black text-white"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="min-w-0">
                    <div className="truncate font-black">{row.name}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      {row.duration_min}분 {row.price != null ? `· ${row.price.toLocaleString()}원` : ""}
                    </div>
                    <div className={`mt-1 text-sm font-bold ${row.active ? "text-[#22a988]" : "text-gray-400"}`}>
                      {row.active ? "활성" : "비활성"}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="min-h-11 rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm font-bold text-gray-600"
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      className="min-h-11 rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm font-bold text-gray-600"
                    >
                      {row.active ? "비활성화" : "활성화"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteService(row.id)}
                      className="min-h-11 rounded-xl border border-red-100 bg-red-50 px-2 py-2 text-sm font-bold text-red-600"
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
