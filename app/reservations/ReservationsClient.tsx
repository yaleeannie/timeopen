"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type ReservationServiceOption = {
  id: string;
  name: string;
  durationMin: number;
  cleanupMin: number;
  price: number | null;
};

export type ReservationCardItem = {
  id: string;
  serviceId: string;
  createdAt: string;
  status: string | null;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  date: string;
  start: string;
  end: string;
  smsStatus: "success" | "partial" | "failed" | "none";
};

type Props = {
  selectedDateLabel: string;
  reservations: ReservationCardItem[];
  services: ReservationServiceOption[];
  emptyText: string;
  emptyHelper: string;
  sortMode: "created_desc" | "start_asc";
};

function formatStatus(status: string | null) {
  if (status === "requested") return "확인 대기";
  if (status === "confirmed") return "확인 완료";
  if (status === "cancelled" || status === "canceled") return "취소됨";
  return status || "-";
}

function statusClass(status: string | null) {
  if (status === "requested") return "border-amber-200/70 bg-amber-50/75 text-amber-700";
  if (status === "confirmed") return "brand-chip";
  if (status === "cancelled" || status === "canceled") {
    return "border-slate-200/70 bg-slate-100/70 text-slate-500";
  }
  return "border-slate-200/70 bg-white/65 text-slate-600";
}

function smsStatusLabel(status: ReservationCardItem["smsStatus"]) {
  if (status === "success") return "문자 완료";
  if (status === "partial") return "문자 일부 완료";
  if (status === "failed") return "문자 실패";
  return "문자 없음";
}

function smsStatusClass(status: ReservationCardItem["smsStatus"]) {
  if (status === "success") return "brand-chip";
  if (status === "partial") return "border-amber-200/70 bg-amber-50/75 text-amber-700";
  if (status === "failed") return "border-rose-200/70 bg-rose-50/75 text-rose-700";
  return "border-slate-200/70 bg-slate-100/65 text-slate-500";
}

function timeRange(start: string, end: string) {
  if (!start && !end) return "시간 미정";
  return `${start || "-"}${end ? ` ~ ${end}` : ""}`;
}

function formatPrice(price: number | null) {
  return typeof price === "number" ? `${price.toLocaleString()}원` : "";
}

function getTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getReservationToastLines(message: string) {
  if (message === "예약이 추가됐고 고객에게 안내 문자를 보냈어요.") {
    return ["예약이 추가됐고", "고객에게 안내 문자를 보냈어요."];
  }

  if (message === "예약은 추가됐지만 문자 발송에 실패했어요.") {
    return ["예약은 추가됐지만", "문자 발송에 실패했어요."];
  }

  return [message];
}

function ManualReservationCreator({ services }: { services: ReservationServiceOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "warning";
  } | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const requestIdRef = useRef(0);
  const [form, setForm] = useState({
    serviceId: services[0]?.id ?? "",
    date: getTodayISO(),
    startTime: "",
    customerName: "",
    customerPhone: "",
    sendCustomerSms: false,
  });

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open && services[0]?.id) {
      setForm((prev) => ({ ...prev, serviceId: prev.serviceId || services[0].id }));
    }
  }, [open, services]);

  useEffect(() => {
    if (!open || !form.serviceId || !form.date) return;

    const requestId = ++requestIdRef.current;
    setLoadingSlots(true);
    setSlotError("");

    fetch("/api/reservations/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: form.serviceId,
        date: form.date,
      }),
    })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) throw new Error(json?.error || "예약 가능 시간을 불러오지 못했어요.");
        return Array.isArray(json?.times) ? json.times.map(String) : [];
      })
      .then((times) => {
        if (requestIdRef.current !== requestId) return;
        setAvailableTimes(times);
        if (!times.includes(form.startTime)) {
          setForm((prev) => ({ ...prev, startTime: "" }));
        }
      })
      .catch((fetchError) => {
        if (requestIdRef.current !== requestId) return;
        setAvailableTimes([]);
        setSlotError(fetchError instanceof Error ? fetchError.message : "예약 가능 시간을 불러오지 못했어요.");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setLoadingSlots(false);
        }
      });
  }, [open, form.serviceId, form.date]);

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetAndClose(options?: { keepToast?: boolean }) {
    setOpen(false);
    if (!options?.keepToast) {
      setToast(null);
    }
    setError("");
    setSlotError("");
    setAvailableTimes([]);
    setForm({
      serviceId: services[0]?.id ?? "",
      date: getTodayISO(),
      startTime: "",
      customerName: "",
      customerPhone: "",
      sendCustomerSms: false,
    });
  }

  async function createReservation() {
    if (saving) return;

    setSaving(true);
    setError("");
    setToast(null);

    try {
      const response = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "예약을 추가하지 못했어요.");
      }

      setToast({
        message: result?.message || "예약이 추가되었어요.",
        tone: result?.smsStatus === "failed" ? "warning" : "success",
      });
      resetAndClose({ keepToast: true });
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "예약을 추가하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setToast(null);
          setError("");
        }}
        disabled={services.length === 0}
        className="brand-button min-h-10 shrink-0 rounded-2xl px-4 text-sm font-black disabled:opacity-50"
      >
        예약 추가
      </button>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-1/2 z-[100] flex w-fit max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 scale-100 flex-col items-center justify-center gap-2 rounded-2xl border bg-white px-5 py-4 text-center text-sm font-black opacity-100 shadow-lg transition-all duration-200 ${
            toast.tone === "warning"
              ? "border-amber-200 text-amber-700"
              : "border-sky-100 text-slate-900"
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
              toast.tone === "warning"
                ? "bg-amber-50 text-amber-600"
                : "bg-sky-50 text-sky-500"
            }`}
            aria-hidden="true"
          >
            {toast.tone === "warning" ? "!" : "✓"}
          </span>
          <span className="grid gap-0.5 leading-5">
            {getReservationToastLines(toast.message).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/10 px-3 py-4 backdrop-blur-[1px] sm:items-center">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-sky-100 bg-white p-4 shadow-[0_24px_80px_rgba(14,165,233,0.12)] sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                  예약 추가
                </h2>
                <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
                  전화, DM, 현장 예약을 TimeOpen 일정에 추가해요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => resetAndClose()}
                disabled={saving}
                className="rounded-full px-3 py-2 text-sm font-black text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                aria-label="예약 추가 닫기"
              >
                ×
              </button>
            </div>

            <div className="grid min-w-0 gap-3">
              <section className="min-w-0">
                <div className="mb-1.5 text-xs font-black text-slate-700">서비스 선택</div>
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <div className="flex w-max max-w-none gap-2">
                    {services.map((service) => {
                      const selected = form.serviceId === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              serviceId: service.id,
                              startTime: service.id === prev.serviceId ? prev.startTime : "",
                            }))
                          }
                          className={`w-[154px] shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                            selected
                              ? "border-sky-300 bg-sky-50 text-slate-900 shadow-[0_8px_24px_rgba(14,165,233,0.12)]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/50"
                          }`}
                        >
                          <div className="truncate text-xs font-black">{service.name}</div>
                          <div className={`mt-0.5 text-[11px] font-bold ${selected ? "text-slate-600" : "text-slate-500"}`}>
                            {service.durationMin}분
                            {formatPrice(service.price) ? ` · ${formatPrice(service.price)}` : ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <label className="grid gap-1 text-xs font-black text-slate-700">
                날짜 선택
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value, startTime: "" }))
                  }
                  className="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <section className="min-w-0">
                <div className="mb-1.5 text-xs font-black text-slate-700">예약 가능한 시간</div>
                {loadingSlots ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">
                    시간을 불러오는 중이에요.
                  </div>
                ) : slotError ? (
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    {slotError}
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">
                    선택한 날짜에 예약 가능한 시간이 없어요.
                  </div>
                ) : (
                  <div className="max-h-[180px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:max-h-[220px]">
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                      {availableTimes.map((time) => {
                        const selected = form.startTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => update("startTime", time)}
                            className={`min-h-9 rounded-xl border text-xs font-black transition ${
                              selected
                                ? "border-sky-500 bg-sky-500 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              <section className="grid min-w-0 gap-2">
                <div className="text-xs font-black text-slate-700">고객 정보</div>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  고객 이름
                  <input
                    value={form.customerName}
                    onChange={(event) => update("customerName", event.target.value)}
                    maxLength={30}
                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  고객 연락처
                  <input
                    value={form.customerPhone}
                    onChange={(event) => update("customerPhone", event.target.value)}
                    maxLength={50}
                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </label>
              </section>

              <label className="rounded-2xl border border-slate-200 bg-sky-50/50 px-3 py-3 text-sm font-bold text-slate-700">
                <span className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={form.sendCustomerSms}
                    onChange={(event) => update("sendCustomerSms", event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    고객에게 예약 확정 문자 보내기
                    <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">
                      전화나 DM으로 이미 안내했다면 체크하지 않아도 돼요.
                    </span>
                  </span>
                </span>
              </label>

              {error ? (
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => resetAndClose()}
                disabled={saving}
                className="min-h-11 rounded-xl px-4 text-sm font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={createReservation}
                disabled={
                  saving ||
                  loadingSlots ||
                  !form.serviceId ||
                  !form.date ||
                  !form.startTime ||
                  !form.customerName.trim() ||
                  !form.customerPhone.trim()
                }
                className="min-h-11 rounded-xl bg-[#00c9ff] px-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(0,201,255,0.24)] transition hover:bg-sky-400 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {saving ? "예약 추가 중..." : "예약 추가"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReservationCard({
  reservation,
  services,
}: {
  reservation: ReservationCardItem;
  services: ReservationServiceOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [slotError, setSlotError] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const requestIdRef = useRef(0);
  const [form, setForm] = useState({
    serviceId: reservation.serviceId,
    customerName: reservation.customerName === "-" ? "" : reservation.customerName,
    customerPhone: reservation.customerPhone === "-" ? "" : reservation.customerPhone,
    date: reservation.date,
    startTime: reservation.start,
  });

  const editable =
    reservation.status !== "cancelled" && reservation.status !== "canceled";

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
    setMessage("");
    setForm({
      serviceId: reservation.serviceId,
      customerName: reservation.customerName === "-" ? "" : reservation.customerName,
      customerPhone: reservation.customerPhone === "-" ? "" : reservation.customerPhone,
      date: reservation.date,
      startTime: reservation.start,
    });
  }

  useEffect(() => {
    if (!editing || !form.serviceId || !form.date) return;

    const requestId = ++requestIdRef.current;
    setLoadingSlots(true);
    setSlotError("");

    fetch("/api/reservations/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId: reservation.id,
        serviceId: form.serviceId,
        date: form.date,
      }),
    })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) throw new Error(json?.error || "예약 가능 시간을 불러오지 못했어요.");
        return Array.isArray(json?.times) ? json.times.map(String) : [];
      })
      .then((times) => {
        if (requestIdRef.current !== requestId) return;
        setAvailableTimes(times);
        if (!times.includes(form.startTime)) {
          setForm((prev) => ({ ...prev, startTime: "" }));
        }
      })
      .catch((fetchError) => {
        if (requestIdRef.current !== requestId) return;
        setAvailableTimes([]);
        setSlotError(fetchError instanceof Error ? fetchError.message : "예약 가능 시간을 불러오지 못했어요.");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setLoadingSlots(false);
        }
      });
  }, [editing, form.serviceId, form.date, reservation.id]);

  async function saveEdit() {
    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/reservations/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId: reservation.id,
            ...form,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "예약을 수정하지 못했어요.");
      }

      setMessage(result?.message || "예약이 수정됐어요.");
      setEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "예약을 수정하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmReservation() {
    if (confirming) return;

    setConfirming(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/reservations/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservation.id }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "예약을 확정하지 못했어요.");
      }

      setMessage(result?.message || "예약이 확정됐어요.");
      router.refresh();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "예약을 확정하지 못했어요.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="relative grid min-w-0 grid-cols-[64px_1fr] gap-2">
      <div className="relative z-10 pt-3 text-center">
        <div className="brand-outline inline-flex min-h-8 items-center rounded-full px-2 text-xs font-black shadow-sm backdrop-blur-xl">
          {reservation.start || "-"}
        </div>
      </div>

      <article
        className={`glass-card min-w-0 rounded-[18px] p-3 ${
          !editable ? "opacity-60" : ""
        }`}
      >
        {!editing ? (
          <>
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-slate-900">
                  {reservation.customerName}
                </div>
                <div className="mt-0.5 truncate text-xs font-bold text-slate-500">
                  {reservation.serviceName}
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(
                  reservation.status
                )}`}
              >
                {formatStatus(reservation.status)}
              </span>
            </div>

            <div className="mt-2 grid gap-1 text-xs font-bold text-slate-500">
              <div className="truncate">{reservation.date}</div>
              <div className="truncate">{timeRange(reservation.start, reservation.end)}</div>
              <div className="truncate">연락처 {reservation.customerPhone}</div>
            </div>

            <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-white/70 pt-2">
              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${smsStatusClass(
                  reservation.smsStatus
                )}`}
              >
                {smsStatusLabel(reservation.smsStatus)}
              </span>

              <div className="flex shrink-0 items-center gap-1.5">
                {reservation.status === "requested" ? (
                  <button
                    type="button"
                    onClick={confirmReservation}
                    disabled={confirming}
                    className="brand-button min-h-9 rounded-xl px-2.5 text-xs font-black disabled:opacity-60"
                  >
                    {confirming ? "확정 중" : "예약 확정"}
                  </button>
                ) : null}
                {editable ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="min-h-9 rounded-xl px-2.5 text-xs font-black text-slate-500 transition hover:bg-white/75 hover:text-slate-800"
                  >
                    수정
                  </button>
                ) : null}
                {reservation.status === "confirmed" || reservation.status === "requested" ? (
                  <form
                    action="/api/reservations/cancel"
                    method="post"
                    onSubmit={() => setCancelling(true)}
                  >
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <button
                      type="submit"
                      disabled={cancelling}
                      className="min-h-9 rounded-xl px-2.5 text-xs font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      {cancelling ? "취소 중..." : "예약 취소"}
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="min-w-0 space-y-2">
            <div className="grid min-w-0 gap-2.5">
              <section className="min-w-0">
                <div className="mb-1.5 text-xs font-black text-slate-700">서비스 선택</div>
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <div className="flex w-max max-w-none gap-2">
                    {services.map((service) => {
                      const selected = form.serviceId === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              serviceId: service.id,
                              startTime:
                                service.id === prev.serviceId ? prev.startTime : "",
                            }))
                          }
                          className={`w-[142px] shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                            selected
                              ? "brand-selected"
                              : "border-white/80 bg-white/65 text-slate-700 hover:bg-white"
                          }`}
                        >
                          <div className="truncate text-xs font-black">{service.name}</div>
                          <div
                            className={`mt-0.5 text-[11px] font-bold ${
                              selected ? "text-white/85" : "text-slate-500"
                            }`}
                          >
                            {service.durationMin}분
                            {formatPrice(service.price)
                              ? ` · ${formatPrice(service.price)}`
                              : ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="min-w-0">
                <label className="grid gap-1 text-xs font-black text-slate-700">
                  날짜 선택
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, date: event.target.value, startTime: "" }))
                    }
                    className="min-h-10 w-full min-w-0 rounded-xl border border-white/80 bg-white/70 px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#00c9ff]"
                  />
                </label>
              </section>

              <section className="min-w-0">
                <div className="mb-1.5 text-xs font-black text-slate-700">예약 가능한 시간</div>
                {loadingSlots ? (
                  <div className="rounded-xl bg-white/55 px-3 py-3 text-xs font-bold text-slate-500">
                    시간을 불러오는 중이에요.
                  </div>
                ) : slotError ? (
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    {slotError}
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="rounded-xl bg-white/55 px-3 py-3 text-xs font-bold text-slate-500">
                    선택한 날짜에 예약 가능한 시간이 없어요.
                  </div>
                ) : (
                  <div className="max-h-[180px] overflow-y-auto rounded-2xl border border-white/70 bg-white/35 p-2 sm:max-h-[220px]">
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                      {availableTimes.map((time) => {
                        const selected = form.startTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => update("startTime", time)}
                            className={`min-h-9 rounded-xl border text-xs font-black transition ${
                              selected
                                ? "brand-selected"
                                : "border-white/80 bg-white/70 text-slate-700 hover:bg-[#e8fbff]"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              <section className="grid min-w-0 gap-2">
                <div className="text-xs font-black text-slate-700">고객 정보</div>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  고객명
                  <input
                    value={form.customerName}
                    onChange={(event) => update("customerName", event.target.value)}
                    maxLength={30}
                    className="min-h-10 w-full min-w-0 rounded-xl border border-white/80 bg-white/70 px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#00c9ff]"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  연락처
                  <input
                    value={form.customerPhone}
                    onChange={(event) => update("customerPhone", event.target.value)}
                    maxLength={50}
                    className="min-h-10 w-full min-w-0 rounded-xl border border-white/80 bg-white/70 px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#00c9ff]"
                  />
                </label>
              </section>
            </div>

            {error ? (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="min-h-10 rounded-xl px-3 text-xs font-black text-slate-500 transition hover:bg-white/75"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving || loadingSlots || !form.serviceId || !form.startTime}
                className="brand-button min-h-10 rounded-xl px-3 text-xs font-black disabled:opacity-50"
              >
                {saving ? "저장 중" : "수정 완료"}
              </button>
            </div>
          </div>
        )}

        {message ? (
          <div className="mt-2 rounded-xl bg-[#e8fbff] px-3 py-2 text-xs font-bold text-[#008fc0]">
            {message}
          </div>
        ) : null}
      </article>
    </div>
  );
}

export default function ReservationsClient({
  selectedDateLabel,
  reservations,
  services,
  emptyText,
  emptyHelper,
  sortMode,
}: Props) {
  const count = reservations.length;
  const sortedReservations = useMemo(
    () => {
      if (sortMode === "start_asc") {
        return [...reservations].sort((a, b) => {
          const dateDiff = (a.date || "").localeCompare(b.date || "");
          if (dateDiff !== 0) return dateDiff;
          return (a.start || "99:99").localeCompare(b.start || "99:99");
        });
      }

      return [...reservations].sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || "")
      );
    },
    [reservations, sortMode]
  );

  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="min-w-0 text-base font-black">{selectedDateLabel}</h2>
          <span className="brand-chip mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold">
            {count}건
          </span>
        </div>
        <ManualReservationCreator services={services} />
      </div>

      {count === 0 ? (
        <div className="glass-card rounded-[24px] px-5 py-10 text-center">
          <div className="brand-soft mx-auto flex h-11 w-11 items-center justify-center rounded-2xl text-xl">
            ◷
          </div>
          <div className="mt-3 text-base font-black">{emptyText}</div>
          <div className="mt-1 text-sm leading-6 text-gray-500">
            {emptyHelper}
          </div>
        </div>
      ) : (
        <section aria-label="선택한 날짜 예약">
          <div className="relative space-y-2 before:absolute before:bottom-5 before:left-[31px] before:top-5 before:w-px before:bg-gradient-to-b before:from-[#00d6f7]/15 before:via-[#00c1ff]/60 before:to-[#00c1ff]/15">
            {sortedReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} services={services} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
