"use client";

type ServiceItem = {
  id: string;
  name: string;
  durationMin?: number;
  duration_min?: number;
  price?: number | null;
};

type Props = {
  services: ServiceItem[];
  value: string | null;
  onChange: (id: string) => void;
};

export default function ServicePicker({ services, value, onChange }: Props) {
  const scrollMode = services.length >= 4;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-900">메뉴판</div>

      <div
        className={
          scrollMode
            ? "flex gap-3 overflow-x-auto pb-2"
            : "grid grid-cols-3 gap-3"
        }
      >
        {services.map((s) => {
          const isActive = value === s.id;
          const duration = s.durationMin ?? s.duration_min ?? null;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={[
                scrollMode ? "min-w-[150px] flex-shrink-0" : "w-full",
                "rounded-[18px] border px-4 py-4 text-left transition",
                isActive
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-gray-900 hover:border-gray-300",
              ].join(" ")}
            >
              <div className="text-[16px] font-semibold leading-tight">
                {s.name}
              </div>

              <div
                className={`mt-2 text-[13px] ${
                  isActive ? "text-gray-200" : "text-gray-500"
                }`}
              >
                {duration ? `${duration}분` : ""}
                {s.price != null ? ` · ${s.price.toLocaleString()}원` : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
