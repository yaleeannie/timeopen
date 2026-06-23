"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import DateChips from "./DateChips";
import TimePicker from "./TimePicker";
import BookingCta from "./BookingCta";
import { usePublicBookingI18n } from "./PublicBookingI18n";

import { fetchServicesByHandle, type ServiceRow } from "@/features/services/fetchServicesByHandle";
import { buildDailySchedule } from "@/features/availability/buildDailySchedule";
import { fetchExceptionForDate } from "@/features/availability/fetchExceptionForDate";
import { fetchHolidayForDate } from "@/features/availability/fetchHolidayForDate";
import { computeAvailableStartTimes } from "@/features/availability/computeAvailableStartTimes";
import {
  getBookingSlotStepMinutes,
  type BookingSlotMode,
} from "@/features/booking/slotMode";
import type { WeeklySchedule } from "@/features/availability/weeklySchedule";

import { fetchBusyFromDb } from "@/features/availability/fetchBusyFromDb";
import { saveReservation } from "@/features/booking/saveReservation";
import {
  normalizePhoneToE164,
  type SupportedPhoneCountry,
} from "@/features/booking/phone";
import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";
import { getLocalizedServiceName } from "@/features/services/serviceTranslations";
import {
  FIELD_LIMITS,
  validateCustomerName,
} from "@/features/validation/fieldLimits";

type Props = { handle: string; bookingSlotMode: BookingSlotMode };
type BookingStep = "service" | "datetime" | "customer";

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}
function minToHhmm(v: number) {
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
const toHHMM = (t: any) => (typeof t === "string" ? t.slice(0, 5) : "");

function convertRowsToWeeklySchedule(rows: any[]): WeeklySchedule {
  const schedule: WeeklySchedule = {
    0: { closed: true },
    1: { closed: true },
    2: { closed: true },
    3: { closed: true },
    4: { closed: true },
    5: { closed: true },
    6: { closed: true },
  };

  for (const row of rows ?? []) {
    const weekday = Number(row.weekday) as keyof WeeklySchedule;

    if (!row.is_open) {
      schedule[weekday] = { closed: true };
      continue;
    }

    schedule[weekday] = {
      closed: false,
      workWindows: [{ start: toHHMM(row.work_start), end: toHHMM(row.work_end) }],
      breaks:
        row.break_start && row.break_end
          ? [{ start: toHHMM(row.break_start), end: toHHMM(row.break_end) }]
          : [],
    };
  }

  return schedule;
}

function formatISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const wonNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatWon(price: number) {
  return `₩${wonNumberFormatter.format(price)}`;
}

export default function BookingScreen({ handle, bookingSlotMode }: Props) {
  const { locale, t } = usePublicBookingI18n();
  const [step, setStep] = useState<BookingStep>("service");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);

  const [dateISO, setDateISO] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const [showEarliestHint, setShowEarliestHint] = useState(false);
  const earliestHintKeyRef = useRef<string | null>(null);

  const userPickedTimeRef = useRef(false);
  const computedKeyRef = useRef<string | null>(null);
  const reqIdRef = useRef(0);

  const [noTimesForCurrent, setNoTimesForCurrent] = useState<boolean>(false);
  const [holidayClosedForCurrent, setHolidayClosedForCurrent] = useState(false);
  const [isTimesLoading, setIsTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState<string>("");

  const [orgLocation, setOrgLocation] = useState<string>("");
  const [orgNotice, setOrgNotice] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  // ✅ Day 1 추가
  const [customerName, setCustomerName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<SupportedPhoneCountry>("KR");
  const [customerPhone, setCustomerPhone] = useState("");

  const lastStableSelectionRef = useRef<{ dateISO: string | null; serviceId: string | null; time: string | null }>({
    dateISO: null,
    serviceId: null,
    time: null,
  });

  const service = useMemo(
  () => services.find((s) => s.id === serviceId) ?? null,
  [services, serviceId]
  );
  const currentKey = useMemo(() => {
    if (!organizationId || !dateISO || !serviceId) return null;
    return `${organizationId}_${dateISO}_${serviceId}`;
  }, [organizationId, dateISO, serviceId]);

  const isTimesReadyForCurrent = currentKey != null && computedKeyRef.current === currentKey;

  const shouldShowEarliestHint =
    showEarliestHint &&
    currentKey != null &&
    earliestHintKeyRef.current === currentKey &&
    isTimesReadyForCurrent &&
    time != null &&
    availableTimes[0] === time;

  const ctaSelection = useMemo(() => {
    if (isTimesReadyForCurrent) {
      lastStableSelectionRef.current = { dateISO, serviceId, time };
      return { dateISO, serviceId, time };
    }
    return lastStableSelectionRef.current;
  }, [isTimesReadyForCurrent, dateISO, serviceId, time]);

  useEffect(() => {
  (async () => {
    const org = await fetchOrganizationByHandle(handle);
    setOrgName((org?.name ?? org?.display_name ?? "").trim());
    setOrgLocation((org?.location_text ?? "").trim());
    setOrgNotice((org?.notice_text ?? "").trim());

    const rows = await fetchServicesByHandle(handle);
    setServices(rows);
    setOrganizationId(org?.id ?? rows[0]?.organization_id ?? null);

    if (rows.length > 0) {
      setServiceId((prev) => prev ?? rows[0].id);
    }
  })();
  }, [handle]);

  useEffect(() => {
    if (!organizationId) return;

    (async () => {
      const res = await fetch("/api/fetchAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      const json = await res.json();
      setWeeklySchedule(convertRowsToWeeklySchedule(json.data));
    })();
  }, [organizationId, handle]);

  async function recomputeTimes(nextDateISO: string | null, nextServiceId: string | null) {
    if (!organizationId || !weeklySchedule) return;
    if (!nextDateISO || !nextServiceId) return;

    const nextService = services.find((s) => s.id === nextServiceId) ?? null;
    if (!nextService) return;

    const myReq = ++reqIdRef.current;
    const cleanupMin = Number(nextService.cleanup_min ?? 0);
    const key = `${organizationId}_${nextDateISO}_${nextServiceId}_${bookingSlotMode}_${cleanupMin}`;

    setIsTimesLoading(true);
    setNoTimesForCurrent(false);
    setHolidayClosedForCurrent(false);
    setTimesError("");

    try {
      const [ex, holiday, busyRes] = await Promise.all([
        fetchExceptionForDate({ handle, dateISO: nextDateISO }),
        fetchHolidayForDate({ handle, dateISO: nextDateISO }),
        fetchBusyFromDb({ handle, dateISO: nextDateISO }),
      ]);

      if (reqIdRef.current !== myReq) return;

      if (holiday?.isClosed) {
        setAvailableTimes([]);
        setTime(null);
        setShowEarliestHint(false);
        earliestHintKeyRef.current = null;
        computedKeyRef.current = key;
        setNoTimesForCurrent(true);
        setHolidayClosedForCurrent(true);
        return;
      }

      const [y, m, d] = nextDateISO.split("-").map(Number);
      const daily = buildDailySchedule(new Date(y, m - 1, d), weeklySchedule, ex ?? null);

      const now = new Date();
      const todayISO = formatISODate(now);
      let notBefore: string | undefined = undefined;
      if (nextDateISO === todayISO) {
        notBefore = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      }

      const busy = busyRes?.busy ?? [];

      const result = computeAvailableStartTimes({
        workWindows: daily.workWindows,
        breaks: daily.breaks,
        busy,
        durationMin: nextService.duration_min,
        bufferMin: cleanupMin,
        stepMin: getBookingSlotStepMinutes({
          mode: bookingSlotMode,
          durationMin: nextService.duration_min,
          cleanupMin,
        }),
        notBefore,
      });

      if (reqIdRef.current !== myReq) return;

      setAvailableTimes(result);
      computedKeyRef.current = key;
      setNoTimesForCurrent(result.length === 0);

      const first = result[0] ?? null;

      if (!userPickedTimeRef.current) {
        setTime(first);
        setShowEarliestHint(first != null);
        earliestHintKeyRef.current = key;
      } else {
        const stillValid = time != null && result.includes(time);
        if (!stillValid) {
          userPickedTimeRef.current = false;
          setTime(first);
          setShowEarliestHint(first != null);
          earliestHintKeyRef.current = key;
        } else {
          setShowEarliestHint(false);
          earliestHintKeyRef.current = null;
        }
      }
    } catch (error) {
      if (reqIdRef.current !== myReq) return;
      console.error("[BookingScreen] available times load failed", error);
      setAvailableTimes([]);
      setNoTimesForCurrent(false);
      setTimesError(t("loadTimesFailed"));
    } finally {
      if (reqIdRef.current === myReq) {
        setIsTimesLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!organizationId || !weeklySchedule || !dateISO || !serviceId) return;

    const key = `${organizationId}_${dateISO}_${serviceId}`;
    if (computedKeyRef.current === key) return;

    void recomputeTimes(dateISO, serviceId);
  }, [bookingSlotMode, organizationId, weeklySchedule, dateISO, serviceId, services]);

  async function onReserve() {
    setMsg("");

    if (!organizationId || !service || !dateISO || !serviceId || !time) return;
    if (!isTimesReadyForCurrent) return;

    // ✅ Day 1 추가: 이름/전화 검증
    const nameValidation = validateCustomerName(customerName);
    if (!nameValidation.ok) {
      setMsg(nameValidation.error);
      return;
    }

    if (!customerPhone.trim()) {
      setMsg(t("enterPhone"));
      return;
    }

    const normalizedPhone = normalizePhoneToE164(phoneCountry, customerPhone);
    if (!normalizedPhone.ok) {
      setMsg(t("invalidPhone"));
      return;
    }

    if (!availableTimes.includes(time)) {
      setMsg(t("unavailableTime"));
      return;
    }

    const end = minToHhmm(hhmmToMin(time) + service.duration_min);
    const cleanupMin = Number(service.cleanup_min ?? 0);

    let rid: string | null = null;

    try {
      const result = await saveReservation({
        handle,
        serviceId: service.id,
        dateISO,
        start: time,
        end,
        durationMin: service.duration_min,
        bufferMin: cleanupMin,
        customerName,
        customerPhone: normalizedPhone.e164,
      });

      if (typeof result === "string") rid = result;
      else rid = (result as any)?.id ?? (result as any)?.[0]?.id ?? null;
    } catch (e: any) {
      setMsg(e?.message ?? t("bookingFailed"));
      return;
    }

    if (!rid) {
      setMsg(t("reservationIdMissing"));
      return;
    }

    console.log("[BookingScreen] notify booking request", {
      reservationId: rid,
      handle,
      hasReservationId: Boolean(rid),
      hasHandle: Boolean(handle),
    });

    await fetch("/api/notify/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: rid, handle }),
    })
      .then(async (response) => {
        console.log("[BookingScreen] notify booking response", {
          status: response.status,
          ok: response.ok,
          body: await response.text(),
        });
      })
      .catch((error) => {
        console.error("[BookingScreen] notify booking request failed", error);
      });

    window.location.href = `/u/${handle}/confirmed?rid=${encodeURIComponent(String(rid))}`;
  }

  const hintSlotHeight = 18;
  const canContinueFromService = serviceId != null;
  const canContinueFromDatetime =
    dateISO != null && time != null && isTimesReadyForCurrent;
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });

  return (
    <div className="space-y-3.5 pb-32">
      <section className="glass-card rounded-[24px] px-4 py-4 text-center">
        <div className="text-lg font-black tracking-[-0.025em] text-slate-950">
          {orgName || `@${handle}`}
        </div>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          원하는 서비스를 고르고 예약 가능한 시간을 확인해보세요.
        </p>
      </section>

      <div className="glass-card rounded-[24px] p-4">
        <div className="flex items-center gap-2">
          {(["service", "datetime", "customer"] as const).map((item, index) => {
            const active = item === step;
            const complete =
              (item === "service" && step !== "service") ||
              (item === "datetime" && step === "customer");

            return (
              <div key={item} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                    active || complete
                      ? "brand-gradient [color:var(--brand-contrast)]"
                      : "brand-soft",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <div
                  className={[
                    "truncate text-xs font-bold",
                    active ? "brand-text" : "text-gray-400",
                  ].join(" ")}
                >
                  {item === "service"
                    ? t("service")
                    : item === "datetime"
                      ? t("dateTime")
                      : t("customerInfo")}
                </div>
                {index < 2 ? (
                  <div className="h-px min-w-2 flex-1 bg-[#dceef2]" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {step === "service" ? (
      <section className="glass-card relative block h-auto min-h-0 w-full overflow-visible rounded-[24px] p-4 opacity-100 visible">
        <div className="text-sm font-semibold text-gray-900">{t("selectService")}</div>

        {services.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {services.map((item) => {
              const active = item.id === serviceId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    userPickedTimeRef.current = false;
                    computedKeyRef.current = null;
                    setTime(null);
                    setAvailableTimes([]);
                    setNoTimesForCurrent(false);
                    setHolidayClosedForCurrent(false);
                    setTimesError("");
                    setIsTimesLoading(dateISO != null);
                    setServiceId(item.id);
                  }}
                  className={[
                    "relative block w-full shrink-0 overflow-visible rounded-[18px] border px-4 py-4 text-left opacity-100 shadow-sm transition visible focus:outline-none",
                    active
                      ? "brand-gradient border-transparent [color:var(--brand-contrast)]"
                      : "brand-outline text-gray-900",
                  ].join(" ")}
                >
                  <div className="text-base font-semibold leading-tight">
                    {getLocalizedServiceName(item.name, item.name_translations, locale)}
                  </div>
                  <div className={`mt-2 text-[13px] leading-5 ${active ? "[color:var(--brand-contrast)] opacity-80" : "text-gray-500"}`}>
                    {item.duration_min ? t("minutes", { count: item.duration_min }) : ""}
                    {item.price != null ? ` · ${formatWon(item.price)}` : ""}
                  </div>
                  {item.description ? (
                    <p
                      className={`mt-2 line-clamp-2 whitespace-pre-line text-sm leading-5 ${
                        active
                          ? "[color:var(--brand-contrast)] opacity-85"
                          : "text-slate-500"
                      }`}
                    >
                      {item.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </section>
      ) : null}

      {step === "datetime" ? (
      <section className="glass-card space-y-4 rounded-[24px] p-4">
        <div className="booking-date-tone [&>div>div:nth-child(2)]:border-0 [&>div>div:nth-child(2)]:p-0">
          <DateChips
            value={dateISO}
            onChange={(next) => {
              userPickedTimeRef.current = false;
              computedKeyRef.current = null;
              setTime(null);
              setAvailableTimes([]);
              setNoTimesForCurrent(false);
              setHolidayClosedForCurrent(false);
              setTimesError("");
              setIsTimesLoading(serviceId != null);
              setDateISO(next);
            }}
          />
        </div>

        <div className="border-t border-[#edf5f7] pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-gray-900">{t("selectTime")}</div>
            <div
              className="text-right text-[11px] font-bold"
              style={{
                color: "var(--brand-primary)",
                opacity: shouldShowEarliestHint ? 1 : 0,
                transition: "opacity 160ms ease",
                pointerEvents: "none",
                minHeight: hintSlotHeight,
              }}
            >
              {t("earliestTime")}
            </div>
          </div>

          <div className="booking-time-tone mt-3 [&_button]:min-h-10 [&_button]:rounded-xl [&_button]:px-4 [&_button]:font-bold">
            {!serviceId || !dateISO ? (
              <TimePicker
                times={[]}
                value={null}
                disabled
                onChange={() => {}}
              />
            ) : isTimesLoading || !organizationId || !weeklySchedule ? (
              <div className="brand-soft rounded-2xl border brand-border px-4 py-6 text-sm font-medium">
                {t("loadingTimes")}
              </div>
            ) : timesError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-sm font-bold text-red-700">
                {timesError}
              </div>
            ) : noTimesForCurrent && isTimesReadyForCurrent ? (
              <div className="rounded-2xl border border-[#dceef2] bg-white px-4 py-6">
                <div className="text-sm font-semibold text-gray-900">
                  {holidayClosedForCurrent ? t("holidayClosed") : t("noTimes")}
                </div>
                {!holidayClosedForCurrent ? (
                  <div className="mt-1 text-sm text-gray-600">
                    {t("continuousTimeRequired")}
                  </div>
                ) : null}
                <div className="mt-3 text-sm text-gray-400">{t("chooseAnotherDate")}</div>
              </div>
            ) : (
              <TimePicker
                times={availableTimes}
                value={time}
                onChange={(t) => {
                  if (!isTimesReadyForCurrent) return;

                  userPickedTimeRef.current = true;
                  setTime(t);

                  setShowEarliestHint(false);
                  earliestHintKeyRef.current = null;
                }}
              />
            )}
          </div>
        </div>
      </section>
      ) : null}

      {step === "customer" ? (
      <>
      <section className="glass-card rounded-[24px] p-4">
        <div className="mb-4 text-base font-black">{t("customerInfo")}</div>
        {/* ✅ Day 1 추가: 고객 정보 입력 */}
        <div>
          <div className="mb-1.5 text-sm font-bold text-gray-700">{t("name")}</div>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t("name")}
            maxLength={FIELD_LIMITS.customerNameMax}
            className="brand-input mb-4 min-h-11 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
          />
        </div>

        <div>
          <div className="mb-1.5 text-sm font-bold text-gray-700">{t("phone")}</div>
          <div className="flex items-stretch gap-2">
            <select
              value={phoneCountry}
              onChange={(e) => setPhoneCountry(e.target.value as SupportedPhoneCountry)}
              aria-label={t("country")}
              className="brand-input min-h-11 w-[132px] min-w-0 shrink-0 rounded-xl px-2.5 py-2.5 text-sm"
            >
              <option value="KR">{regionNames.of("KR") ?? "KR"} +82</option>
              <option value="JP">{regionNames.of("JP") ?? "JP"} +81</option>
              <option value="US">{regionNames.of("US") ?? "US"} +1</option>
              <option value="CA">{regionNames.of("CA") ?? "CA"} +1</option>
              <option value="TH">{regionNames.of("TH") ?? "TH"} +66</option>
              <option value="CN">{regionNames.of("CN") ?? "CN"} +86</option>
            </select>

            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={t("phone")}
              inputMode="tel"
              className="brand-input min-h-11 min-w-0 flex-1 rounded-xl px-3 py-2.5 text-base"
            />
          </div>
          {locale === "ko" ? (
            <p className="mt-2 text-[11px] font-medium leading-5 text-slate-400">
              해외 번호 문자 알림은 준비 중입니다. 현재는 한국 번호 기준으로 먼저
              테스트하고 있어요.
            </p>
          ) : null}
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">
            {msg}
          </div>
        ) : null}
      </section>

      {(orgLocation || orgNotice) ? (
        <section className="glass-card rounded-[24px] p-4">
          <div className="mb-4 text-base font-black">{t("visitorGuide")}</div>
          {orgLocation ? (
            <div className="mb-4">
              <div className="brand-text text-sm font-bold">{t("location")}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">{orgLocation}</div>
            </div>
          ) : null}

          {orgNotice ? (
            <div>
              <div className="brand-text text-sm font-bold">{t("bookingNotice")}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">{orgNotice}</div>
            </div>
          ) : null}
        </section>
      ) : null}
      </>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dceef2] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,118,140,0.08)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          {step !== "service" ? (
            <button
              type="button"
              onClick={() => setStep(step === "customer" ? "datetime" : "service")}
              className="brand-outline min-h-12 shrink-0 rounded-2xl px-4 text-sm font-black transition"
            >
              {t("previous")}
            </button>
          ) : null}

          {step === "service" ? (
            <button
              type="button"
              disabled={!canContinueFromService}
              onClick={() => setStep("datetime")}
              className="brand-button min-h-12 w-full rounded-2xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-[#b8dfe8]"
            >
              {t("next")}
            </button>
          ) : step === "datetime" ? (
            <button
              type="button"
              disabled={!canContinueFromDatetime}
              onClick={() => setStep("customer")}
              className="brand-button min-h-12 min-w-0 flex-1 rounded-2xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-[#b8dfe8]"
            >
              {t("next")}
            </button>
          ) : (
            <div className="min-w-0 flex-1">
              <BookingCta selection={ctaSelection} onReserve={onReserve} />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .booking-date-tone button,
        .booking-time-tone button {
          transition:
            border-color 160ms ease,
            background-color 160ms ease,
            color 160ms ease,
            box-shadow 160ms ease;
        }

        .booking-date-tone button:not([style*="linear-gradient"]):hover,
        .booking-time-tone button:not([style*="linear-gradient"]):hover {
          border-color: var(--brand-primary) !important;
          background: var(--brand-soft) !important;
        }

        .booking-date-tone button:focus-visible,
        .booking-time-tone button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--brand-focus);
        }
      `}</style>
    </div>
  );
}
