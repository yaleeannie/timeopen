"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SERVICE_TRANSLATION_LABELS,
  SERVICE_TRANSLATION_LOCALES,
  normalizeServiceNameTranslations,
  type ServiceNameTranslations,
} from "@/features/services/serviceTranslations";

type Props = {
  organizationId: string;
};

type ServiceRow = {
  id: string;
  name: string;
  name_translations: ServiceNameTranslations;
  duration_min: number;
  price: number | null;
  active: boolean;
};

function TranslationFields({
  value,
  onChange,
  tone = "light",
}: {
  value: ServiceNameTranslations;
  onChange: (next: ServiceNameTranslations) => void;
  tone?: "light" | "cyan";
}) {
  const labelClass = tone === "cyan" ? "text-white/90" : "text-gray-700";
  const inputClass =
    tone === "cyan"
      ? "border-white/30 bg-white text-gray-900"
      : "brand-input";

  return (
    <details className={`rounded-2xl border p-3 ${tone === "cyan" ? "border-white/35 bg-white/15" : "glass-card"}`}>
      <summary className={`cursor-pointer text-sm font-black ${labelClass}`}>
        외국어 메뉴명
      </summary>
      <div className="mt-4 grid gap-3">
        {SERVICE_TRANSLATION_LOCALES.map((locale) => (
          <label key={locale} className="block">
            <span className={`mb-1.5 block text-sm font-bold ${labelClass}`}>
              {SERVICE_TRANSLATION_LABELS[locale]}
            </span>
            <input
              value={value[locale] ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  [locale]: event.target.value,
                })
              }
              placeholder={SERVICE_TRANSLATION_LABELS[locale]}
              className={`min-h-11 w-full min-w-0 rounded-xl border px-3 py-2.5 text-base outline-none ${inputClass}`}
            />
          </label>
        ))}
      </div>
    </details>
  );
}

export default function ServicesEditor({ organizationId }: Props) {
  const supabase = createSupabaseBrowserClient();

  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [price, setPrice] = useState("");
  const [nameTranslations, setNameTranslations] = useState<ServiceNameTranslations>({});
  const [msg, setMsg] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDurationMin, setEditDurationMin] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editNameTranslations, setEditNameTranslations] = useState<ServiceNameTranslations>({});

  async function load() {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, name_translations, duration_min, price, active")
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
      setMsg("메뉴명을 입력해주세요.");
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
      name_translations: normalizeServiceNameTranslations(nameTranslations),
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
    setNameTranslations({});
    setMsg("저장되었습니다.");
    await load();
  }

  function startEdit(row: ServiceRow) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditNameTranslations(normalizeServiceNameTranslations(row.name_translations));
    setEditDurationMin(String(row.duration_min));
    setEditPrice(row.price != null ? String(row.price) : "");
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDurationMin("");
    setEditPrice("");
    setEditNameTranslations({});
  }

  async function saveEdit(id: string) {
    setMsg("");

    if (!editName.trim()) {
      setMsg("메뉴명을 입력해주세요.");
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
        name_translations: normalizeServiceNameTranslations(editNameTranslations),
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
    const ok = window.confirm("이 메뉴를 삭제할까요?");
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
      <div className="brand-gradient mb-6 rounded-[24px] p-5 text-white shadow-[0_14px_30px_rgba(0,193,255,0.22)]">
        <div className="mb-4 text-lg font-black">새 메뉴</div>
        <div className="grid gap-4">
        <div>
          <div className="mb-1.5 text-sm font-bold text-white/90">메뉴명</div>
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

        <TranslationFields
          value={nameTranslations}
          onChange={setNameTranslations}
          tone="cyan"
        />

        <button
          type="button"
          onClick={addService}
          className="brand-outline min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-black shadow-sm"
        >
          메뉴 저장
        </button>
        </div>
      </div>

      {msg ? <div className="brand-chip mb-4 rounded-xl px-4 py-3 text-sm font-bold [overflow-wrap:anywhere]">{msg}</div> : null}

      <div className="mb-3 flex items-center justify-between px-1">
        <div className="text-base font-black">메뉴판</div>
        <div className="text-sm font-bold text-gray-400">{rows.length}개</div>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => {
          const isEditing = editingId === row.id;

          return (
            <div
              key={row.id}
              className="glass-card min-w-0 rounded-2xl p-4"
            >
              {isEditing ? (
                <div className="grid gap-4">
                  <div>
                    <div className="mb-1.5 text-sm font-bold text-gray-700">메뉴명</div>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="메뉴명"
                      className="brand-input min-h-11 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 text-sm font-bold text-gray-700">소요시간 (분)</div>
                    <input
                      value={editDurationMin}
                      onChange={(e) => setEditDurationMin(e.target.value)}
                      placeholder="소요시간(분)"
                      inputMode="numeric"
                      className="brand-input min-h-11 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 text-sm font-bold text-gray-700">가격 (원, 선택)</div>
                    <input
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="가격"
                      inputMode="numeric"
                      className="brand-input min-h-11 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
                    />
                  </div>

                  <TranslationFields
                    value={editNameTranslations}
                    onChange={setEditNameTranslations}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(row.id)}
                      className="brand-button min-h-11 rounded-xl px-4 py-2.5 text-sm font-black"
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
                    <div className={`mt-1 text-sm font-bold ${row.active ? "brand-text" : "text-gray-400"}`}>
                      {row.active ? "활성" : "비활성"}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="brand-outline min-h-11 rounded-xl px-2 py-2 text-sm font-bold"
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      className="brand-outline min-h-11 rounded-xl px-2 py-2 text-sm font-bold"
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
