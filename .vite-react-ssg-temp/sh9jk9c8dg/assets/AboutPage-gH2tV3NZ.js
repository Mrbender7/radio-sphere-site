import { jsx, jsxs } from "react/jsx-runtime";
import { u as useTranslation, b as radioSphereLogo, O as OnboardingBanner, c as cn } from "../main.mjs";
import { Settings, ChevronDown, Rewind, Globe, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { A as AboutFooter } from "./AboutFooter-CT1poT1z.js";
import "react-dom";
import "vite-react-ssg";
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
function CollapsibleSection({ icon: Icon, title, badge, children }) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "w-full rounded-xl bg-accent p-4 mb-4 text-left transition-all", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        className: "w-full flex items-center gap-2",
        type: "button",
        children: [
          /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: title }),
          badge && /* @__PURE__ */ jsx("span", { className: "ml-auto", children: badge }),
          /* @__PURE__ */ jsx(ChevronDown, { className: cn("w-4 h-4 text-muted-foreground transition-transform duration-300 ml-auto", open && "rotate-180") })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[800px] opacity-100 mt-3" : "max-h-0 opacity-0"
        ),
        children
      }
    )
  ] });
}
function AboutPage({ onReopenWelcome, onNavigatePrivacy, onNavigateSettings }) {
  const { t } = useTranslation();
  const [radioBrowserOpen, setRadioBrowserOpen] = useState(false);
  return /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-4 lg:px-8 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto min-h-full flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-6 mb-6", children: [
      /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be", className: "w-10 h-10 object-contain rounded-xl mix-blend-screen animate-logo-glow" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent drop-shadow-[0_0_12px_hsla(250,80%,60%,0.4)]", children: t("nav.about") })
    ] }),
    /* @__PURE__ */ jsx(OnboardingBanner, {}),
    onNavigateSettings && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onNavigateSettings,
        className: "w-full flex items-center justify-between gap-3 rounded-xl bg-accent hover:bg-accent/70 p-4 mb-4 text-left transition-colors lg:hidden",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: t("nav.settings") }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                t("settings.language"),
                " · ",
                t("sleepTimer.title"),
                " · ",
                t("favorites.manage")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground -rotate-90" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(CollapsibleSection, { icon: Rewind, title: "TimeBack Machine", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-xs text-muted-foreground leading-relaxed", children: [
      /* @__PURE__ */ jsx("p", { children: t("tbmModal.intro") }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: t("tbmModal.bufferTitle") }),
        /* @__PURE__ */ jsx("p", { children: t("tbmModal.bufferDesc") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: t("tbmModal.rewindTitle") }),
        /* @__PURE__ */ jsx("p", { children: t("tbmModal.rewindDesc") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: t("tbmModal.recordTitle") }),
        /* @__PURE__ */ jsx("p", { children: t("tbmModal.recordDesc") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: t("tbmModal.iconTitle") }),
        /* @__PURE__ */ jsx("p", { children: t("tbmModal.iconDesc") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: t("tbmModal.liveTitle") }),
        /* @__PURE__ */ jsx("p", { children: t("tbmModal.liveDesc") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 rounded-lg border border-border bg-accent/30", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-foreground text-xs mb-1", children: [
          "📱 ",
          t("tbmQuota.title")
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs", children: t("tbmQuota.description") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setRadioBrowserOpen((o) => !o),
        className: "w-full rounded-xl border border-border bg-accent/50 p-4 mb-4 text-left transition-all",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4 text-primary shrink-0" }),
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground flex-1", children: t("settings.radioSource") }),
            /* @__PURE__ */ jsx(ChevronDown, { className: cn("w-4 h-4 text-muted-foreground transition-transform duration-300", radioBrowserOpen && "rotate-180") })
          ] }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                radioBrowserOpen ? "max-h-80 opacity-100 mt-2" : "max-h-0 opacity-0"
              ),
              children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground leading-relaxed pl-7 mb-3", children: [
                  t("footer.poweredByPrefix"),
                  /* @__PURE__ */ jsx(
                    "a",
                    {
                      href: "https://www.radio-browser.info/",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      onClick: (e) => e.stopPropagation(),
                      className: "text-primary hover:underline",
                      children: "Radio Browser"
                    }
                  ),
                  t("footer.poweredBySuffix")
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed pl-7 mb-3", children: t("settings.radioSourceDesc") }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 pl-7", children: [
                  /* @__PURE__ */ jsxs("a", { href: "https://www.radio-browser.info/", target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), className: "inline-flex items-center gap-1.5 text-xs text-primary hover:underline", children: [
                    /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
                    " ",
                    t("settings.radioSourceLink")
                  ] }),
                  /* @__PURE__ */ jsxs("a", { href: "https://www.radio-browser.info/add", target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), className: "inline-flex items-center gap-1.5 text-xs text-primary hover:underline", children: [
                    /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
                    " ",
                    t("settings.radioSourceAddStation")
                  ] })
                ] })
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(CollapsibleSection, { icon: ShieldCheck, title: t("settings.analytics") || "Mesure d'audience", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed mb-3", children: t("settings.analyticsDesc") || "RadioSphere.be utilise Umami Analytics, une solution de mesure d'audience respectueuse de la vie privée et conforme au RGPD." }),
      /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-xs text-muted-foreground leading-relaxed", children: [
        /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
          /* @__PURE__ */ jsx("span", { children: t("settings.analyticsNoCookies") || "Aucun cookie de suivi" })
        ] }),
        /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
          /* @__PURE__ */ jsx("span", { children: t("settings.analyticsAnonymous") || "Données entièrement anonymisées" })
        ] }),
        /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
          /* @__PURE__ */ jsx("span", { children: t("settings.analyticsGDPR") || "Conforme au RGPD européen" })
        ] }),
        /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-primary mt-0.5", children: "✓" }),
          /* @__PURE__ */ jsx("span", { children: t("settings.analyticsUsage") || "Mesure uniquement l'utilisation globale (pages vues, fonctionnalités utilisées)" })
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
            t("settings.analyticsLearnMore") || "En savoir plus sur Umami"
          ]
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-8", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onNavigatePrivacy,
          className: "flex items-center justify-center gap-1.5 text-xs text-primary hover:underline mb-3 w-full",
          children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5" }),
            t("settings.privacyPolicy")
          ]
        }
      ),
      onReopenWelcome && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onReopenWelcome,
          className: "flex items-center justify-center gap-1.5 text-xs text-primary hover:underline mb-3 w-full",
          children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
            t("settings.reopenWelcome")
          ]
        }
      ),
      /* @__PURE__ */ jsx(AboutFooter, {})
    ] })
  ] }) });
}
export {
  AboutPage
};
