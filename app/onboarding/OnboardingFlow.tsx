"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookingUrl } from "@/lib/siteUrl";

type InitialService = {
  name: string;
  durationMin: number;
  price: number | null;
} | null;

type InitialAvailability = {
  weekdays: number[];
  startTime: string;
  endTime: string;
};

type Props = {
  initialName: string;
  initialLocation: string;
  initialNotice: string;
  initialHandle: string;
  initialService: InitialService;
  initialAvailability: InitialAvailability;
};

const WEEKDAYS = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 0, label: "일" },
];

const STEP_COPY = [
  {
    title: "매장 정보를 알려주세요",
    description: "고객에게 보여질 매장 이름과 안내를 설정해요.",
  },
  {
    title: "첫 서비스를 등록해볼까요?",
    description: "고객이 예약할 서비스와 가격, 소요 시간을 입력해요.",
  },
  {
    title: "예약 가능한 시간을 정해요",
    description: "처음에는 간단히 운영 요일과 시간을 정하면 돼요.",
  },
  {
    title: "예약 링크를 만들어요",
    description: "고객에게 공유할 나만의 예약 주소예요.",
  },
];

const INTRO_STEPS = [
  "매장 정보",
  "서비스 설정",
  "영업시간 설정",
  "예약 링크 만들기",
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error ?? `저장 실패 (HTTP ${response.status})`);
  }

  return json;
}

export default function OnboardingFlow({
  initialName,
  initialLocation,
  initialNotice,
  initialHandle,
  initialService,
  initialAvailability,
}: Props) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialName);
  const [locationText, setLocationText] = useState(initialLocation);
  const [noticeText, setNoticeText] = useState(initialNotice);

  const [serviceName, setServiceName] = useState(initialService?.name ?? "");
  const [price, setPrice] = useState(
    initialService?.price == null ? "" : String(initialService.price)
  );
  const [durationMin, setDurationMin] = useState(
    initialService?.durationMin ? String(initialService.durationMin) : ""
  );

  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    initialAvailability.weekdays
  );
  const [startTime, setStartTime] = useState(initialAvailability.startTime);
  const [endTime, setEndTime] = useState(initialAvailability.endTime);
  const [handle, setHandle] = useState(initialHandle);

  const bookingUrl = useMemo(
    () => (handle ? getBookingUrl(handle) : "https://timeopen.app/u/your-shop"),
    [handle]
  );

  function moveTo(nextStep: number) {
    setError("");
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function skipStep() {
    moveTo(Math.min(step + 1, 3));
  }

  function goBack() {
    if (step > 0) {
      moveTo(step - 1);
    }
  }

  function toggleWeekday(value: number) {
    setSelectedWeekdays((current) =>
      current.includes(value)
        ? current.filter((weekday) => weekday !== value)
        : [...current, value]
    );
  }

  async function saveCurrentStep() {
    setError("");
    setSaving(true);

    try {
      if (step === 0) {
        await postJson("/api/settings/profile", {
          name,
          location_text: locationText,
          notice_text: noticeText,
        });
      }

      if (step === 1) {
        await postJson("/api/onboarding/service", {
          name: serviceName,
          price,
          durationMin,
        });
      }

      if (step === 2) {
        if (selectedWeekdays.length === 0) {
          throw new Error("운영 요일을 한 개 이상 선택해주세요.");
        }

        if (!startTime || !endTime || startTime >= endTime) {
          throw new Error("시작 시간은 종료 시간보다 빨라야 합니다.");
        }

        await postJson("/api/settings/availability", {
          rows: WEEKDAYS.map(({ value }) => {
            const isOpen = selectedWeekdays.includes(value);
            return {
              weekday: value,
              is_open: isOpen,
              work_start: isOpen ? startTime : null,
              work_end: isOpen ? endTime : null,
              break_start: null,
              break_end: null,
            };
          }),
        });
      }

      moveTo(step + 1);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function saveHandle() {
    const cleanHandle = handle.trim().toLowerCase();

    if (!/^[a-z0-9-]{3,30}$/.test(cleanHandle)) {
      throw new Error("영어 소문자, 숫자, 하이픈으로 3~30자를 입력해주세요.");
    }

    await postJson("/api/settings/handle", { handle: cleanHandle });
    setHandle(cleanHandle);
    return cleanHandle;
  }

  async function finish(destination: "preview" | "dashboard") {
    setError("");
    setSaving(true);

    try {
      const savedHandle = await saveHandle();

      if (destination === "preview") {
        window.location.assign(`/u/${savedHandle}`);
        return;
      }

      router.push("/owner");
      router.refresh();
    } catch (saveError) {
      setError(errorMessage(saveError));
      setSaving(false);
    }
  }

  const inputClass =
    "min-h-12 w-full rounded-2xl border border-[#dcecef] bg-white px-4 py-3 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-[#4fcbe6] focus:ring-4 focus:ring-cyan-50";
  const labelClass = "mb-2 block text-sm font-black text-gray-700";

  if (!started) {
    return (
      <main className="min-h-screen bg-[#eef7f8] px-3 py-4 text-gray-950 sm:px-5 sm:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[30px] bg-[#fbfdfd] shadow-[0_24px_70px_rgba(57,112,126,0.16)] sm:min-h-[760px] sm:rounded-[38px]">
          <div className="px-5 pb-4 pt-6 sm:px-7 sm:pt-8">
            <div className="text-sm font-black text-[#1aa9c7]">TimeOpen 시작하기</div>
          </div>

          <section className="flex flex-1 flex-col px-5 pb-5 sm:px-7 sm:pb-7">
            <header className="pb-6 pt-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] text-2xl font-black text-white shadow-[0_14px_30px_rgba(40,185,220,0.24)]">
                T
              </div>
              <h1 className="mt-6 text-3xl font-black leading-tight tracking-[-0.045em]">
                예약 링크를 만들
                <br />
                준비를 해볼까요?
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-gray-500">
                매장 정보, 서비스, 영업시간만 설정하면 고객이 로그인 없이 예약할 수
                있어요.
              </p>
            </header>

            <ol className="grid gap-3 rounded-[28px] border border-[#e1eef0] bg-white p-4 shadow-[0_14px_34px_rgba(70,126,139,0.08)]">
              {INTRO_STEPS.map((title, index) => (
                <li
                  key={title}
                  className="flex min-h-14 items-center gap-3 rounded-2xl bg-[#f7fbfc] px-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e6f8fb] text-sm font-black text-[#168ca8]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black text-gray-800">{title}</span>
                </li>
              ))}
            </ol>

            <div className="mt-auto pt-7">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 text-base font-black text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)]"
              >
                시작하기
              </button>
              <button
                type="button"
                onClick={() => router.push("/owner")}
                className="mt-2 min-h-11 w-full rounded-xl px-4 text-sm font-bold text-gray-400"
              >
                건너뛰고 대시보드로
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef7f8] px-3 py-4 text-gray-950 sm:px-5 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[30px] bg-[#fbfdfd] shadow-[0_24px_70px_rgba(57,112,126,0.16)] sm:min-h-[760px] sm:rounded-[38px]">
        <div className="px-5 pb-4 pt-6 sm:px-7 sm:pt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm font-black text-[#1aa9c7]">TimeOpen 시작하기</div>
            <div className="rounded-full bg-[#e8f9fc] px-3 py-1.5 text-sm font-black text-[#168ca8]">
              {step + 1}/4
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2" aria-label={`온보딩 ${step + 1}단계`}>
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full ${
                  index <= step ? "bg-[#35c3df]" : "bg-[#dcecef]"
                }`}
              />
            ))}
          </div>
        </div>

        <section className="flex flex-1 flex-col px-5 pb-5 sm:px-7 sm:pb-7">
          <header className="pb-5 pt-3">
            <h1 className="text-3xl font-black leading-tight tracking-[-0.045em]">
              {STEP_COPY[step].title}
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
              {STEP_COPY[step].description}
            </p>
          </header>

          <div className="rounded-[26px] border border-[#e1eef0] bg-white p-5 shadow-[0_14px_34px_rgba(70,126,139,0.08)]">
            {step === 0 ? (
              <div className="grid gap-5">
                <label>
                  <span className={labelClass}>매장 이름</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="예: 지수 헤어"
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>위치 안내</span>
                  <textarea
                    value={locationText}
                    onChange={(event) => setLocationText(event.target.value)}
                    placeholder="예: 홍대입구역 3번 출구에서 도보 3분"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </label>
                <label>
                  <span className={labelClass}>예약 안내 문구</span>
                  <textarea
                    value={noticeText}
                    onChange={(event) => setNoticeText(event.target.value)}
                    placeholder="예: 예약 시간 10분 전까지 도착해주세요."
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </label>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5">
                {initialService ? (
                  <div className="rounded-2xl bg-[#eefaf7] px-4 py-3 text-sm font-bold leading-5 text-[#23846d]">
                    이미 등록된 첫 서비스를 불러왔어요. 저장하면 이 서비스를 수정합니다.
                  </div>
                ) : null}
                <label>
                  <span className={labelClass}>서비스명</span>
                  <input
                    value={serviceName}
                    onChange={(event) => setServiceName(event.target.value)}
                    placeholder="예: 커트"
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>가격</span>
                  <div className="relative">
                    <input
                      value={price}
                      onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="30000"
                      inputMode="numeric"
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      원
                    </span>
                  </div>
                </label>
                <label>
                  <span className={labelClass}>소요 시간</span>
                  <div className="relative">
                    <input
                      value={durationMin}
                      onChange={(event) =>
                        setDurationMin(event.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="30"
                      inputMode="numeric"
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      분
                    </span>
                  </div>
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-6">
                <div>
                  <span className={labelClass}>운영 요일</span>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map(({ value, label }) => {
                      const selected = selectedWeekdays.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleWeekday(value)}
                          className={`aspect-square min-h-10 rounded-xl text-sm font-black transition ${
                            selected
                              ? "bg-[#31bfdc] text-white shadow-[0_8px_18px_rgba(49,191,220,0.24)]"
                              : "bg-[#f1f6f7] text-gray-500"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className={labelClass}>시작 시간</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>종료 시간</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
                <p className="rounded-2xl bg-[#f7fafb] px-4 py-3 text-sm font-medium leading-5 text-gray-500">
                  선택한 모든 요일에 같은 운영 시간이 적용돼요. 세부 시간과 휴게시간은
                  나중에 설정에서 바꿀 수 있어요.
                </p>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-5">
                <label>
                  <span className={labelClass}>나만의 예약 주소</span>
                  <div className="flex min-h-12 items-center rounded-2xl border border-[#dcecef] bg-white focus-within:border-[#4fcbe6] focus-within:ring-4 focus-within:ring-cyan-50">
                    <span className="shrink-0 pl-4 text-sm font-bold text-gray-400">/u/</span>
                    <input
                      value={handle}
                      onChange={(event) =>
                        setHandle(
                          event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      placeholder="my-shop"
                      className="min-h-12 min-w-0 flex-1 rounded-2xl bg-transparent px-2 py-3 text-base font-bold text-gray-950 outline-none"
                    />
                  </div>
                  <span className="mt-2 block text-xs font-medium leading-5 text-gray-400">
                    영어 소문자, 숫자, 하이픈(-)을 3~30자로 입력해주세요.
                  </span>
                </label>

                <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-[#eefcfa] to-[#eef8fd] p-4">
                  <div className="text-xs font-black text-[#168ca8]">예약 링크 미리보기</div>
                  <div className="mt-2 break-all text-sm font-black leading-6 text-gray-800">
                    {bookingUrl}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-auto pt-6">
            {step < 3 ? (
              <div>
                <div className={`grid gap-3 ${step > 0 ? "grid-cols-[0.8fr_1.2fr]" : ""}`}>
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={saving}
                      className="min-h-14 rounded-2xl border border-[#dcecef] bg-white px-4 text-sm font-black text-gray-500 disabled:opacity-50"
                    >
                      이전
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={saveCurrentStep}
                    disabled={saving}
                    className="min-h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 text-base font-black text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)] disabled:opacity-50"
                  >
                    {saving ? "저장 중..." : "다음"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={skipStep}
                  disabled={saving}
                  className="mt-2 min-h-10 w-full rounded-xl px-4 text-sm font-bold text-gray-400 disabled:opacity-50"
                >
                  이 단계 건너뛰기
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => finish("dashboard")}
                  disabled={saving}
                  className="min-h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 text-base font-black text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)] disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "대시보드로 가기"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={saving}
                    className="min-h-11 rounded-xl border border-[#dcecef] bg-white px-3 text-sm font-black text-gray-500 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() => finish("preview")}
                    disabled={saving}
                    className="min-h-11 rounded-xl bg-[#effbfc] px-3 text-sm font-black text-[#168ca8] disabled:opacity-50"
                  >
                    URL 확인하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
