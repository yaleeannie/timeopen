export const LINK_THEME_NAMES = ["minimal", "beauty", "simple", "glow"] as const;

export type LinkTheme = (typeof LINK_THEME_NAMES)[number];

type ThemeDefinition = {
  label: string;
  page: string;
  shell: string;
  logo: string;
  preview: string;
  previewCard: string;
  previewAccent: string;
  variables: {
    "--brand-primary": string;
    "--brand-accent": string;
    "--brand-soft": string;
    "--brand-border": string;
    "--booking-shell-bg": string;
    "--booking-card-bg": string;
    "--booking-shadow": string;
  };
};

export const PUBLIC_BOOKING_THEMES: Record<LinkTheme, ThemeDefinition> = {
  minimal: {
    label: "미니멀",
    page: "bg-gradient-to-br from-slate-50 via-white to-cyan-50",
    shell: "glass-shell",
    logo: "brand-gradient",
    preview: "bg-gradient-to-br from-slate-100 to-white",
    previewCard: "border-slate-200 bg-white",
    previewAccent: "bg-slate-700",
    variables: {
      "--brand-primary": "#334155",
      "--brand-accent": "#00C1FF",
      "--brand-soft": "#f1f5f9",
      "--brand-border": "rgba(100, 116, 139, 0.32)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.78)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.9)",
      "--booking-shadow": "0 18px 54px rgba(51, 65, 85, 0.1)",
    },
  },
  beauty: {
    label: "뷰티",
    page: "bg-gradient-to-br from-cyan-50 via-white to-blue-50",
    shell: "glass-shell",
    logo: "brand-gradient",
    preview: "bg-gradient-to-br from-[#e6fbff] via-white to-[#eaf3ff]",
    previewCard: "border-white/80 bg-white/80",
    previewAccent: "bg-gradient-to-r from-[#74E8FA] to-[#5ABEFF]",
    variables: {
      "--brand-primary": "#38AEEF",
      "--brand-accent": "#74E8FA",
      "--brand-soft": "#ebfbff",
      "--brand-border": "rgba(116, 232, 250, 0.55)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.58)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.72)",
      "--booking-shadow": "0 24px 68px rgba(56, 174, 239, 0.14)",
    },
  },
  simple: {
    label: "심플",
    page: "bg-[#f5fbfe]",
    shell: "glass-shell",
    logo: "brand-gradient",
    preview: "bg-[#f5fbfe]",
    previewCard: "border-[#d8f2fb] bg-white",
    previewAccent: "bg-[#00C1FF]",
    variables: {
      "--brand-primary": "#00AEEA",
      "--brand-accent": "#00C1FF",
      "--brand-soft": "#e9faff",
      "--brand-border": "rgba(0, 193, 255, 0.4)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.82)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.92)",
      "--booking-shadow": "0 16px 46px rgba(0, 174, 234, 0.09)",
    },
  },
  glow: {
    label: "글로우",
    page: "soft-page-bg",
    shell: "glass-shell",
    logo: "brand-gradient",
    preview: "bg-gradient-to-br from-[#ddfbff] via-white to-[#dcefff]",
    previewCard: "border-white/80 bg-white/65 backdrop-blur",
    previewAccent: "brand-gradient",
    variables: {
      "--brand-primary": "#00C1FF",
      "--brand-accent": "#00D6F7",
      "--brand-soft": "#e9faff",
      "--brand-border": "rgba(125, 223, 255, 0.48)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.46)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.68)",
      "--booking-shadow": "0 24px 70px rgba(0, 193, 255, 0.13)",
    },
  },
};

export const DEFAULT_PUBLIC_BOOKING_THEME: LinkTheme = "glow";

export function isLinkTheme(value: unknown): value is LinkTheme {
  return typeof value === "string" && LINK_THEME_NAMES.includes(value as LinkTheme);
}

export function normalizeLinkTheme(value: unknown): LinkTheme {
  return isLinkTheme(value) ? value : DEFAULT_PUBLIC_BOOKING_THEME;
}
