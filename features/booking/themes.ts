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
  storyGlow: boolean;
  variables: {
    "--brand-primary": string;
    "--brand-accent": string;
    "--brand-ink": string;
    "--brand-contrast": string;
    "--brand-soft": string;
    "--brand-border": string;
    "--brand-shadow": string;
    "--brand-focus": string;
    "--booking-shell-bg": string;
    "--booking-card-bg": string;
    "--booking-shadow": string;
  };
};

export const PUBLIC_BOOKING_THEMES: Record<LinkTheme, ThemeDefinition> = {
  minimal: {
    label: "미니멀",
    page: "bg-[#F7F7F7]",
    shell: "glass-shell",
    logo: "brand-gradient",
    preview: "bg-[#F5F5F5]",
    previewCard: "border-slate-200 bg-white",
    previewAccent: "bg-black",
    storyGlow: false,
    variables: {
      "--brand-primary": "#111111",
      "--brand-accent": "#111111",
      "--brand-ink": "#111111",
      "--brand-contrast": "#FFFFFF",
      "--brand-soft": "#F3F4F6",
      "--brand-border": "rgba(17, 17, 17, 0.22)",
      "--brand-shadow": "rgba(17, 17, 17, 0.14)",
      "--brand-focus": "rgba(17, 17, 17, 0.16)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.94)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.98)",
      "--booking-shadow": "0 16px 42px rgba(15, 23, 42, 0.08)",
    },
  },
  beauty: {
    label: "뷰티",
    page: "bg-[#FFF8FC]",
    shell: "glass-shell",
    logo: "brand-gradient",
    preview: "bg-[#FFF4FA]",
    previewCard: "border-[#FFD1E8] bg-white",
    previewAccent: "bg-[#FF69B4]",
    storyGlow: false,
    variables: {
      "--brand-primary": "#FF69B4",
      "--brand-accent": "#FF69B4",
      "--brand-ink": "#D93687",
      "--brand-contrast": "#FFFFFF",
      "--brand-soft": "#FFF0F7",
      "--brand-border": "rgba(255, 105, 180, 0.34)",
      "--brand-shadow": "rgba(255, 105, 180, 0.2)",
      "--brand-focus": "rgba(255, 105, 180, 0.18)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.92)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.96)",
      "--booking-shadow": "0 18px 48px rgba(255, 105, 180, 0.1)",
    },
  },
  simple: {
    label: "톡톡",
    page: "bg-[#FFFCF2]",
    shell: "glass-shell",
    logo: "brand-gradient",
    preview: "bg-[#FFF8DD]",
    previewCard: "border-[#FFE59A] bg-white",
    previewAccent: "bg-[#FFBF00]",
    storyGlow: false,
    variables: {
      "--brand-primary": "#FFBF00",
      "--brand-accent": "#FFBF00",
      "--brand-ink": "#8A6700",
      "--brand-contrast": "#111111",
      "--brand-soft": "#FFF7D6",
      "--brand-border": "rgba(216, 159, 0, 0.34)",
      "--brand-shadow": "rgba(216, 159, 0, 0.18)",
      "--brand-focus": "rgba(216, 159, 0, 0.18)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.92)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.97)",
      "--booking-shadow": "0 16px 44px rgba(216, 159, 0, 0.09)",
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
    storyGlow: true,
    variables: {
      "--brand-primary": "#00C1FF",
      "--brand-accent": "#00D6F7",
      "--brand-ink": "#00C9FF",
      "--brand-contrast": "#FFFFFF",
      "--brand-soft": "#e9faff",
      "--brand-border": "rgba(125, 223, 255, 0.48)",
      "--brand-shadow": "rgba(0, 193, 255, 0.18)",
      "--brand-focus": "rgba(0, 193, 255, 0.16)",
      "--booking-shell-bg": "rgba(255, 255, 255, 0.64)",
      "--booking-card-bg": "rgba(255, 255, 255, 0.78)",
      "--booking-shadow": "0 20px 58px rgba(0, 193, 255, 0.1)",
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
