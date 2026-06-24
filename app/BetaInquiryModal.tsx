"use client";

import { useState } from "react";
import {
  BETA_INQUIRY_LIMITS,
  BOOKING_METHOD_OPTIONS,
  MONTHLY_BOOKING_VOLUME_OPTIONS,
  PAIN_POINT_OPTIONS,
  SHOP_TYPE_OPTIONS,
} from "@/features/betaInquiry/validation";

const faqItems = [
  {
    question: "베타 기간에는 무료인가요?",
    answer:
      "네. 베타 기간에는 무료로 사용할 수 있고, 정식 출시 후에는 월 정액제 플랜으로 전환될 예정입니다.",
  },
  {
    question: "고객도 가입해야 하나요?",
    answer:
      "아니요. 고객은 인스타 프로필 링크를 열고 로그인 없이 서비스와 시간을 선택해 예약할 수 있어요.",
  },
  {
    question: "인스타 프로필에 링크를 걸 수 있나요?",
    answer:
      "네. TimeOpen에서 만든 인스타 예약 링크를 복사해 프로필 링크에 넣으면 됩니다.",
  },
  {
    question: "네이버 예약과 뭐가 다른가요?",
    answer:
      "TimeOpen은 인스타 DM으로 예약받는 1인샵이 빠르게 링크를 만들고, 빈 시간을 스토리나 DM에 공유하는 흐름에 집중합니다.",
  },
  {
    question: "외국인 고객도 예약할 수 있나요?",
    answer:
      "다국어 예약은 준비 중이에요. 해외 번호 문자 알림도 준비 중입니다.",
  },
  {
    question: "빈 시간 공유는 뭔가요?",
    answer:
      "예약 가능한 날짜와 시간을 골라 인스타 스토리나 DM에 붙여넣을 메시지와 스토리 이미지를 만드는 기능입니다.",
  },
];

type Props = {
  variant?: "hero" | "footer";
};

type FormState = {
  name: string;
  contact: string;
  shop_name: string;
  shop_type: string;
  current_booking_method: string;
  pain_point: string;
  monthly_booking_volume: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  contact: "",
  shop_name: "",
  shop_type: SHOP_TYPE_OPTIONS[0],
  current_booking_method: BOOKING_METHOD_OPTIONS[0],
  pain_point: PAIN_POINT_OPTIONS[0],
  monthly_booking_volume: MONTHLY_BOOKING_VOLUME_OPTIONS[1],
  message: "",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-sm font-black text-slate-700">{children}</div>;
}

export default function BetaInquiryModal({ variant = "hero" }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/beta-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json: { error?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(json.error ?? "문의 접수 중 오류가 발생했습니다.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "footer"
            ? "flex min-h-14 items-center justify-center rounded-2xl bg-white px-5 text-base font-black text-[#0098CB] shadow-lg transition hover:bg-[#F2FCFF]"
            : "brand-button flex min-h-14 items-center justify-center rounded-2xl px-6 text-base font-black"
        }
      >
        베타 파트너 신청하기
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 px-3 py-5 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-lg rounded-[30px] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="brand-text text-sm font-black">TimeOpen Beta</div>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  베타 파트너 신청
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  인스타로 예약받는 1인샵에 맞춰 베타 안내를 보내드릴게요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500"
              >
                ×
              </button>
            </div>

            {submitted ? (
              <div className="mt-5">
                <div className="brand-soft rounded-[24px] p-5">
                  <div className="text-lg font-black text-slate-950">
                    문의가 접수되었어요.
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                    남겨주신 연락처로 베타 안내를 보내드릴게요.
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  {faqItems.map((item) => (
                    <details key={item.question} className="glass-card rounded-2xl p-4">
                      <summary className="cursor-pointer text-sm font-black text-slate-900">
                        {item.question}
                      </summary>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 grid gap-4">
                <label>
                  <FieldLabel>이름</FieldLabel>
                  <input
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    maxLength={BETA_INQUIRY_LIMITS.nameMax}
                    className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
                    placeholder="예: 김사장"
                  />
                </label>

                <label>
                  <FieldLabel>연락처</FieldLabel>
                  <input
                    value={form.contact}
                    onChange={(event) => update("contact", event.target.value)}
                    maxLength={BETA_INQUIRY_LIMITS.contactMax}
                    className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
                    placeholder="이메일 / 전화번호 / 인스타 ID"
                  />
                </label>

                <label>
                  <FieldLabel>샵 이름</FieldLabel>
                  <input
                    value={form.shop_name}
                    onChange={(event) => update("shop_name", event.target.value)}
                    maxLength={BETA_INQUIRY_LIMITS.shopNameMax}
                    className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
                    placeholder="예: 타임네일"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <FieldLabel>샵 유형</FieldLabel>
                    <select
                      value={form.shop_type}
                      onChange={(event) => update("shop_type", event.target.value)}
                      className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
                    >
                      {SHOP_TYPE_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <FieldLabel>현재 예약 방식</FieldLabel>
                    <select
                      value={form.current_booking_method}
                      onChange={(event) =>
                        update("current_booking_method", event.target.value)
                      }
                      className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
                    >
                      {BOOKING_METHOD_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <FieldLabel>가장 불편한 점</FieldLabel>
                    <select
                      value={form.pain_point}
                      onChange={(event) => update("pain_point", event.target.value)}
                      className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
                    >
                      {PAIN_POINT_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <FieldLabel>월 예약 규모</FieldLabel>
                    <select
                      value={form.monthly_booking_volume}
                      onChange={(event) =>
                        update("monthly_booking_volume", event.target.value)
                      }
                      className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-base"
                    >
                      {MONTHLY_BOOKING_VOLUME_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <FieldLabel>남기고 싶은 말</FieldLabel>
                  <textarea
                    value={form.message}
                    onChange={(event) => update("message", event.target.value)}
                    maxLength={BETA_INQUIRY_LIMITS.messageMax}
                    rows={4}
                    className="brand-input w-full resize-none rounded-2xl px-4 py-3 text-base"
                    placeholder="현재 예약에서 가장 번거로운 부분을 알려주세요."
                  />
                  <div className="mt-1 text-right text-xs font-bold text-slate-400">
                    {form.message.length}/{BETA_INQUIRY_LIMITS.messageMax}
                  </div>
                </label>

                {error ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="brand-button min-h-14 rounded-2xl px-5 text-base font-black disabled:opacity-60"
                >
                  {submitting ? "접수 중..." : "문의 접수하기"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
