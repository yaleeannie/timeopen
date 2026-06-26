"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { SLOT_INTERVAL_MINUTES } from "@/features/availability/slotInterval";

type TimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

type TimeOption = {
  value: string;
  label: string;
};

const OPTIONS_PER_HOUR = 60 / SLOT_INTERVAL_MINUTES;

const TIME_OPTIONS: TimeOption[] = Array.from({ length: 24 * OPTIONS_PER_HOUR }, (_, index) => {
  const hour = Math.floor(index / OPTIONS_PER_HOUR);
  const minute = (index % OPTIONS_PER_HOUR) * SLOT_INTERVAL_MINUTES;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return { value, label: formatTime(value) };
});

function formatTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return "";

  const hour = Number(match[1]);
  if (hour > 23) return "";

  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;
  return `${period} ${displayHour}:${match[2]}`;
}

export default function TimeSelect({
  value,
  onChange,
  placeholder = "시간 선택",
  allowEmpty = false,
  disabled = false,
  className = "",
  "aria-label": ariaLabel = "시간 선택",
}: TimeSelectProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const selectedIndex = TIME_OPTIONS.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));
  const displayValue = formatTime(value);
  const panelReady = Boolean(panelStyle);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelHeight = 240;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < panelHeight + gap && rect.top > spaceBelow;

    setPanelStyle({
      left: rect.left,
      top: openAbove ? Math.max(8, rect.top - panelHeight - gap) : rect.bottom + gap,
      width: rect.width,
    });
  }

  function close() {
    setOpen(false);
    setPanelStyle(undefined);
  }

  function selectTime(nextValue: string) {
    onChange(nextValue);
    close();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function toggle() {
    if (disabled) return;

    if (open) {
      close();
      return;
    }

    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(Math.max(selectedIndex, 0));
        return;
      }

      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) =>
        Math.min(TIME_OPTIONS.length - 1, Math.max(0, current + direction))
      );
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      selectTime(TIME_OPTIONS[activeIndex].value);
    }
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        close();
      }
    }

    function handleViewportChange() {
      updatePosition();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const activeOption = panelRef.current?.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, panelReady]);

  const dropdown = open && panelStyle
    ? createPortal(
        <div
          ref={panelRef}
          id={listboxId}
          role="listbox"
          aria-label={`${ariaLabel} 목록`}
          style={panelStyle}
          className="brand-border fixed z-[100] max-h-60 overflow-y-auto overscroll-contain rounded-2xl border bg-white/95 p-1.5 shadow-[0_16px_40px_rgba(0,145,195,0.16)] backdrop-blur-xl"
        >
          {allowEmpty ? (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              tabIndex={-1}
              onClick={() => selectTime("")}
              className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-bold transition ${
                !value
                  ? "brand-soft"
                  : "text-gray-500 hover:bg-[#00d6f7]/10 focus:bg-[#00d6f7]/10"
              }`}
            >
              선택 안 함
            </button>
          ) : null}

          {TIME_OPTIONS.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;

            return (
              <button
                key={option.value}
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                data-option-index={index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectTime(option.value)}
                className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-bold transition ${
                  selected
                    ? "brand-soft"
                    : active
                      ? "bg-[#00d6f7]/10 text-gray-900"
                      : "text-gray-700 hover:bg-[#00d6f7]/10 focus:bg-[#00d6f7]/10"
                }`}
              >
                <span>{option.label}</span>
                {selected ? (
                  <span aria-hidden="true" className="brand-text text-base">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`min-w-0 max-w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={`box-border flex min-h-12 w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-left text-sm font-bold outline-none transition ${
          open
            ? "brand-border ring-4 ring-[#00c1ff]/10"
            : "border-[#00c1ff]/35 hover:border-[#00c1ff]"
        } disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
      >
        <span className={displayValue ? "text-gray-900" : "text-gray-400"}>
          {displayValue || placeholder}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className={`brand-text h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {dropdown}
    </div>
  );
}
