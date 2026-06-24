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
};

function formatStatus(status: string | null) {
  if (status === "confirmed") return "확정";
  if (status === "cancelled" || status === "canceled") return "취소됨";
  return status || "-";
}

function statusClass(status: string | null) {
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
                {editable ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="min-h-9 rounded-xl px-2.5 text-xs font-black text-slate-500 transition hover:bg-white/75 hover:text-slate-800"
                  >
                    수정
                  </button>
                ) : null}
                {reservation.status === "confirmed" ? (
                  <form action="/api/reservations/cancel" method="post">
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <button
                      type="submit"
                      className="min-h-9 rounded-xl px-2.5 text-xs font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      예약 취소
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

export default function ReservationsClient({ selectedDateLabel, reservations, services }: Props) {
  const count = reservations.length;
  const sortedReservations = useMemo(
    () =>
      [...reservations].sort((a, b) =>
        `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)
      ),
    [reservations]
  );

  return (
    <>
      <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
        <h2 className="min-w-0 text-base font-black">{selectedDateLabel}</h2>
        <span className="brand-chip shrink-0 rounded-full px-2.5 py-1 text-xs font-bold">
          {count}건
        </span>
      </div>

      {count === 0 ? (
        <div className="glass-card rounded-[24px] px-5 py-10 text-center">
          <div className="brand-soft mx-auto flex h-11 w-11 items-center justify-center rounded-2xl text-xl">
            ◷
          </div>
          <div className="mt-3 text-base font-black">이 날짜에는 예약이 없어요.</div>
          <div className="mt-1 text-sm leading-6 text-gray-500">
            캘린더에서 다른 날짜를 선택해 예약 일정을 확인해보세요.
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
