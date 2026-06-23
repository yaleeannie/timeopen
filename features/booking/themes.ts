export const PUBLIC_BOOKING_THEMES = {
  minimal: {
    page: "bg-slate-50",
    shell: "bg-white/90",
    logo: "bg-slate-950",
  },
  beauty: {
    page: "bg-gradient-to-br from-cyan-50 via-white to-blue-50",
    shell: "bg-white/75",
    logo: "brand-gradient",
  },
  simple: {
    page: "soft-page-bg",
    shell: "glass-shell",
    logo: "brand-gradient",
  },
  glow: {
    page: "soft-page-bg",
    shell: "glass-shell shadow-[0_24px_70px_rgba(0,193,255,0.13)]",
    logo: "brand-gradient shadow-[0_12px_26px_rgba(0,193,255,0.22)]",
  },
} as const;

export type PublicBookingThemeName = keyof typeof PUBLIC_BOOKING_THEMES;

export const DEFAULT_PUBLIC_BOOKING_THEME: PublicBookingThemeName = "glow";
