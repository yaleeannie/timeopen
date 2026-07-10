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
  type BookingSlotIntervalMinutes,
  getBookingSlotStepMinutes,
} from "@/features/booking/slotMode";
import {
  buildBookingTimeSelectionKey,
  getEarliestAvailableTime,
  shouldShowEarliestTimeHint,
} from "@/features/booking/timeSelection";
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
import { canSubmitCustomerReservation } from "@/features/legal/consent";

type Props = {
  handle: string;
  bookingSlotIntervalMin: BookingSlotIntervalMinutes;
  initialOrganizationId?: string | null;
  initialOrgName?: string;
  initialLocation?: string;
  initialNotice?: string;
  initialBookingNotice?: string;
};
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

function ServiceLoadingSkeleton() {
  return (
    <div className="mt-3 flex flex-col gap-3" aria-label="서비스를 불러오는 중이에요">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-[18px] border border-white/70 bg-white/60 px-4 py-4 shadow-sm"
        >
          <div className="h-4 w-1/2 rounded-full bg-[#dff7fc]" />
          <div className="mt-3 h-3 w-1/3 rounded-full bg-[#eef8fb]" />
          <div className="mt-3 h-3 w-5/6 rounded-full bg-[#eef8fb]" />
        </div>
      ))}
    </div>
  );
}

function TimeLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="brand-soft rounded-2xl border brand-border px-4 py-4">
      <div className="text-sm font-bold brand-text">{label}</div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-10 rounded-xl bg-white/70" />
        ))}
      </div>
    </div>
  );
}

export default function BookingScreen({
  handle,
  bookingSlotIntervalMin,
  initialOrganizationId = null,
  initialOrgName = "",
  initialLocation = "",
  initialNotice = "",
  initialBookingNotice = "",
}: Props) {
  const { locale, t } = usePublicBookingI18n();
  const [step, setStep] = useState<BookingStep>("service");
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialOrganizationId || null
  );
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [isInitialBookingLoading, setIsInitialBookingLoading] = useState(true);

  const [dateISO, setDateISO] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const userPickedTimeRef = useRef(false);
  const computedKeyRef = useRef<string | null>(null);
  const reqIdRef = useRef(0);

  const [noTimesForCurrent, setNoTimesForCurrent] = useState<boolean>(false);
  const [holidayClosedForCurrent, setHolidayClosedForCurrent] = useState(false);
  const [isTimesLoading, setIsTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState<string>("");

  const [orgLocation, setOrgLocation] = useState<string>(initialLocation.trim());
  const [orgNotice, setOrgNotice] = useState<string>(initialNotice.trim());
  const [orgBookingNotice, setOrgBookingNotice] = useState<string>(
    initialBookingNotice.trim()
  );
  const [orgName, setOrgName] = useState<string>(initialOrgName.trim());

  const [msg, setMsg] = useState<string>("");
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);

  // ✅ Day 1 추가
  const [customerName, setCustomerName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<SupportedPhoneCountry>("KR");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPrivacyAgreed, setCustomerPrivacyAgreed] = useState(false);

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
    return buildBookingTimeSelectionKey({
      organizationId,
      dateISO,
      serviceId,
      bookingSlotMode: "flexible",
      bookingSlotIntervalMin,
      durationMin: service?.duration_min ?? null,
      cleanupMin: service?.cleanup_min ?? 0,
    });
  }, [
    bookingSlotIntervalMin,
    organizationId,
    dateISO,
    serviceId,
    service?.duration_min,
    service?.cleanup_min,
  ]);

  const isTimesReadyForCurrent = currentKey != null && computedKeyRef.current === currentKey;
  const showEarliestTimeHint =
    isTimesReadyForCurrent &&
    shouldShowEarliestTimeHint({
      times: availableTimes,
      selectedTime: time,
    });

  const ctaSelection = useMemo(() => {
    if (isTimesReadyForCurrent) {
      lastStableSelectionRef.current = { dateISO, serviceId, time };
      return { dateISO, serviceId, time };
    }
    return lastStableSelectionRef.current;
  }, [isTimesReadyForCurrent, dateISO, serviceId, time]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setIsInitialBookingLoading(true);

      try {
        let currentOrganizationId = initialOrganizationId || null;

        if (!currentOrganizationId) {
          const org = await fetchOrganizationByHandle(handle);
          if (!alive) return;

          currentOrganizationId = org?.id ?? null;
          setOrgName((org?.name ?? org?.display_name ?? "").trim());
          setOrgLocation((org?.location_text ?? "").trim());
          setOrgNotice((org?.notice_text ?? "").trim());
          setOrgBookingNotice((org?.booking_notice ?? "").trim());
        }

        const rows = await fetchServicesByHandle(handle);
        if (!alive) return;

        setServices(rows);
        setOrganizationId(currentOrganizationId ?? rows[0]?.organization_id ?? null);

        if (rows.length > 0) {
          setServiceId((prev) => prev ?? rows[0].id);
        }
      } catch (error) {
        console.error("[BookingScreen] initial booking data load failed", error);
      } finally {
        if (alive) {
          setIsInitialBookingLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [handle, initialOrganizationId]);

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
    const key = buildBookingTimeSelectionKey({
      organizationId,
      dateISO: nextDateISO,
      serviceId: nextServiceId,
      bookingSlotMode: "flexible",
      bookingSlotIntervalMin,
      durationMin: nextService.duration_min,
      cleanupMin,
    });

    if (!key) return;

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
          mode: "flexible",
          durationMin: nextService.duration_min,
          cleanupMin,
          intervalMin: bookingSlotIntervalMin,
        }),
        notBefore,
      });

      if (reqIdRef.current !== myReq) return;

      setAvailableTimes(result);
      computedKeyRef.current = key;
      setNoTimesForCurrent(result.length === 0);

      const first = getEarliestAvailableTime(result);

      if (!userPickedTimeRef.current) {
        setTime(first);
      } else {
        const stillValid = time != null && result.includes(time);
        if (!stillValid) {
          userPickedTimeRef.current = false;
          setTime(first);
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

    const key = currentKey;
    if (computedKeyRef.current === key) return;

    void recomputeTimes(dateISO, serviceId);
  }, [currentKey, organizationId, weeklySchedule, dateISO, serviceId, services]);

  async function onReserve() {
    if (isSubmittingReservation) return;

    setMsg("");

    if (!organizationId || !service || !dateISO || !serviceId || !time) return;
    if (!isTimesReadyForCurrent) return;

    if (!customerPrivacyAgreed) {
      setMsg("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

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
    setIsSubmittingReservation(true);

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
        customerPrivacyAgreed,
      });

      if (typeof result === "string") rid = result;
      else rid = (result as any)?.id ?? (result as any)?.[0]?.id ?? null;
    } catch (e: any) {
      setMsg(e?.message ?? t("bookingFailed"));
      setIsSubmittingReservation(false);
      return;
    }

    if (!rid) {
      setMsg(t("reservationIdMissing"));
      setIsSubmittingReservation(false);
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

  const canContinueFromService = serviceId != null && !isInitialBookingLoading;
  const canContinueFromDatetime =
    dateISO != null && time != null && !isTimesLoading && isTimesReadyForCurrent;
  const canReserveFromCustomer = canSubmitCustomerReservation({
    hasSelection: ctaSelection.serviceId !== null &&
      ctaSelection.dateISO !== null &&
      ctaSelection.time !== null,
    hasValidName: validateCustomerName(customerName).ok,
    hasPhone: customerPhone.trim().length > 0,
    customerPrivacyAgreed,
  });
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {(["service", "datetime", "customer"] as const).map((item, index) => {
            const active = item === step;
            const complete =
              (item === "service" && step !== "service") ||
              (item === "datetime" && step === "customer");
            const desktopLabel =
              item === "service"
                ? t("service")
                : item === "datetime"
                  ? t("dateTime")
                  : t("customerInfo");
            const mobileLabel =
              item === "service"
                ? t("service")
                : item === "datetime"
                  ? t("dateTimeShort")
                  : t("customerInfoShort");

            return (
              <div key={item} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black sm:h-8 sm:w-8 sm:text-xs",
                    active || complete
                      ? "brand-gradient [color:var(--brand-contrast)]"
                      : "brand-soft",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <div
                  className={[
                    "min-w-0 truncate text-[11px] font-bold sm:text-xs",
                    active ? "brand-text" : "text-gray-400",
                  ].join(" ")}
                >
                  <span className="sm:hidden">{mobileLabel}</span>
                  <span className="hidden sm:inline">{desktopLabel}</span>
                </div>
                {index < 2 ? (
                  <div className="h-px min-w-1 flex-1 bg-[#dceef2] sm:min-w-2" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {step === "service" ? (
      <section className="glass-card relative block h-auto min-h-0 w-full overflow-visible rounded-[24px] p-4 opacity-100 visible">
        <div className="text-sm font-semibold text-gray-900">{t("selectService")}</div>

        {isInitialBookingLoading ? (
          <ServiceLoadingSkeleton />
        ) : services.length > 0 ? (
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
                    setCustomerPrivacyAgreed(false);
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
        ) : (
          <div className="mt-3 rounded-2xl border border-[#dceef2] bg-white/75 px-4 py-6 text-center">
            <div className="text-base font-black text-slate-900">
              아직 예약 가능한 서비스가 없어요.
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
              샵에 문의해 예약 가능 여부를 확인해주세요.
            </p>
          </div>
        )}
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
              setCustomerPrivacyAgreed(false);
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
          </div>
          {showEarliestTimeHint ? (
            <p className="mt-1.5 text-xs font-semibold brand-text">
              {t("earliestTime")}
            </p>
          ) : null}

          <div className="booking-time-tone mt-3 [&_button]:min-h-10 [&_button]:rounded-xl [&_button]:px-4 [&_button]:font-bold">
            {!serviceId || !dateISO ? (
              <TimePicker
                times={[]}
                value={null}
                disabled
                onChange={() => {}}
              />
            ) : isTimesLoading || !organizationId || !weeklySchedule ? (
              <TimeLoadingSkeleton label={t("loadingTimes")} />
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
                  setCustomerPrivacyAgreed(false);
                  setTime(t);
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

        {orgBookingNotice ? (
          <div className="mt-4 rounded-2xl border border-[#dceef2] bg-white/70 p-3">
            <div className="brand-text text-sm font-black">예약 전 안내</div>
            <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600 [overflow-wrap:anywhere]">
              {orgBookingNotice}
            </p>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-[#dceef2] bg-white/65 p-3">
          <label className="flex min-w-0 items-start gap-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={customerPrivacyAgreed}
              onChange={(event) => {
                setCustomerPrivacyAgreed(event.target.checked);
                if (event.target.checked) setMsg("");
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#00C9FF]"
            />
            <span className="min-w-0 leading-5">
              [필수] 개인정보 수집·이용에 동의합니다.
            </span>
          </label>
          <p className="mt-2 pl-7 text-[11px] font-medium leading-5 text-slate-500">
            예약 접수 및 관리를 위해 이름, 연락처, 예약 일시, 선택한 서비스,
            요청사항이 TimeOpen과 해당 매장 운영자에게 전달됩니다.
          </p>
          <details className="mt-2 pl-7 text-[11px] font-medium leading-5 text-slate-500">
            <summary className="cursor-pointer brand-text font-black">
              자세히 보기
            </summary>
            <div className="mt-2 space-y-1.5 rounded-xl bg-white/70 px-3 py-2">
              <p>
                <span className="font-black text-slate-600">수집 항목:</span>{" "}
                예약자 이름, 연락처, 예약 일시, 선택한 서비스, 요청사항
              </p>
              <p>
                <span className="font-black text-slate-600">수집 목적:</span>{" "}
                예약 접수, 예약 확인, 예약 변경·취소 안내, 매장과 고객 간 예약
                관련 연락
              </p>
              <p>
                <span className="font-black text-slate-600">보유 기간:</span>{" "}
                예약 관리 및 분쟁 대응을 위해 필요한 기간 동안 보관하며,
                보유 목적이 달성되면 관련 법령 및 내부 기준에 따라
                파기합니다.
              </p>
              <p>
                <span className="font-black text-slate-600">동의 거부권:</span>{" "}
                동의하지 않을 경우 예약 접수가 제한될 수 있습니다.
              </p>
              <a href="/privacy" className="inline-flex brand-text font-black underline underline-offset-2">
                개인정보 처리방침 보기
              </a>
            </div>
          </details>
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
              onClick={() => {
                if (step === "customer") {
                  setCustomerPrivacyAgreed(false);
                  setStep("datetime");
                  return;
                }
                setStep("service");
              }}
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
              <BookingCta
                selection={ctaSelection}
                onReserve={onReserve}
                canReserve={canReserveFromCustomer}
                loading={isSubmittingReservation}
              />
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
