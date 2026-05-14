import { dark } from "@clerk/ui/themes";

export const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorBackground: "var(--bg-surface)",
    colorInputBackground: "var(--bg-elevated)",
    colorInputText: "var(--text-primary)",
    colorText: "var(--text-primary)",
    colorTextSecondary: "var(--text-secondary)",
    colorNeutral: "var(--text-muted)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    cardBox: "shadow-none",
    card: "border border-surface-border bg-surface",
    footer: "bg-surface",
    formButtonPrimary:
      "bg-brand text-primary-foreground hover:bg-brand focus-visible:ring-brand",
    headerTitle: "text-copy-primary",
    headerSubtitle: "text-copy-muted",
    socialButtonsBlockButton:
      "border-surface-border bg-elevated text-copy-primary hover:bg-subtle",
    formFieldInput:
      "border-subtle-border bg-elevated text-copy-primary focus-visible:ring-brand",
    footerActionLink: "text-brand hover:text-brand",
  },
};
