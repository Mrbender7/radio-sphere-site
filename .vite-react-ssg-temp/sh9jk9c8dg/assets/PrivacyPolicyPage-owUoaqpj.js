import { jsx, jsxs } from "react/jsx-runtime";
import { u as useTranslation, b as radioSphereLogo } from "../main.mjs";
import { ArrowLeft, ShieldCheck, BarChart3, ExternalLink, Mail } from "lucide-react";
import "react-dom";
import "vite-react-ssg";
import "react";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "react-router-dom";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-slot";
import "@radix-ui/react-slider";
import "@radix-ui/react-dialog";
import "@radix-ui/react-popover";
import "@radix-ui/react-select";
function PrivacyPolicyPage({ onBack }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-4 lg:px-8 pb-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-6 mb-8", children: [
      onBack && /* @__PURE__ */ jsx("button", { onClick: onBack, className: "p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" }) }),
      /* @__PURE__ */ jsx(ShieldCheck, { className: "w-6 h-6 text-primary" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: t("privacy.title") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-foreground/90 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { className: "rounded-xl bg-accent/50 border border-border p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
          /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be", className: "w-8 h-8 object-contain rounded-lg" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: "RadioSphere.be" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("privacy.lastUpdated"),
          ": 15 mars 2026"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Web Player — radiosphere.be" })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold text-foreground mb-3", children: t("privacy.dataCollection") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("privacy.dataCollectionDesc") })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold text-foreground mb-3", children: t("privacy.localStorage") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("privacy.localStorageDesc") }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside mt-2 space-y-1 text-muted-foreground text-xs", children: [
          /* @__PURE__ */ jsx("li", { children: t("privacy.localStorageFavorites") }),
          /* @__PURE__ */ jsx("li", { children: t("privacy.localStorageLang") }),
          /* @__PURE__ */ jsx("li", { children: t("privacy.localStorageRecent") }),
          /* @__PURE__ */ jsx("li", { children: t("privacy.localStoragePrefs") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "rounded-xl bg-accent/50 border border-border p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold text-foreground", children: t("privacy.analytics") })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-3", children: t("privacy.analyticsDesc") }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
            /* @__PURE__ */ jsx("span", { children: t("privacy.analyticsNoCookies") })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
            /* @__PURE__ */ jsx("span", { children: t("privacy.analyticsAnonymous") })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
            /* @__PURE__ */ jsx("span", { children: t("privacy.analyticsGDPR") })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
            /* @__PURE__ */ jsx("span", { children: t("privacy.analyticsNoPersonal") })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: "https://umami.is/privacy",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "inline-flex items-center gap-1.5 text-xs text-primary hover:underline",
            children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
              t("privacy.analyticsLearnMore")
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold text-foreground mb-3", children: t("privacy.thirdParty") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("privacy.thirdPartyDesc") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: t("privacy.thirdPartyUmami") })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold text-foreground mb-3", children: t("privacy.permissions") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("privacy.permissionsDesc") })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold text-foreground mb-3", children: t("privacy.security") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("privacy.securityDesc") })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold text-foreground mb-3", children: t("privacy.contact") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-3", children: t("privacy.contactDesc") }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "mailto:info@radiosphere.be",
            className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium",
            children: [
              /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4" }),
              "info@radiosphere.be"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
export {
  PrivacyPolicyPage
};
