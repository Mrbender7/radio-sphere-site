import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { useState, useRef } from "react";
import { t as toast, u as useTranslation, d as useIsMobile, D as Dialog, e as DialogTrigger, f as DialogContent, h as DialogHeader, i as DialogTitle, c as cn, j as useSleepTimer, k as useFavoritesContext, l as Select, m as SelectTrigger, n as SelectValue, o as SelectContent, L as LANGUAGE_OPTIONS, p as SelectItem, q as SLEEP_TIMER_OPTIONS, B as Button, v as isNative, w as searchStationByUrl, A as AlertDialog, x as AlertDialogTrigger, y as AlertDialogContent, z as AlertDialogHeader, C as AlertDialogTitle, E as AlertDialogDescription, F as AlertDialogFooter, G as AlertDialogCancel, H as AlertDialogAction, I as DialogDescription, J as DialogFooter, K as DialogClose } from "../main.mjs";
import { BookOpen, ChevronDown, RefreshCw, Home, Search, Heart, Settings, ShieldAlert, Moon, Rewind, Cast, TimerOff, Download, Upload, Trash2, Wifi } from "lucide-react";
import { I as Input } from "./input-6XZgwDxx.js";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
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
async function requestAllPermissions() {
  let granted = 0;
  let total = 0;
  try {
    total++;
    if (window.hasOwnProperty("Capacitor")) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      if (result.display === "granted") granted++;
    } else if ("Notification" in window) {
      const result = await Notification.requestPermission();
      if (result === "granted") granted++;
    } else {
      granted++;
    }
  } catch {
    console.log("[Permissions] Notification permission request failed");
  }
  try {
    toast({
      title: `${granted}/${total}`,
      description: granted === total ? "✅ All permissions granted" : "⚠️ Some permissions were denied. You can enable them in your device settings."
    });
  } catch {
  }
}
const SECTIONS = [
  { id: "home", icon: Home, titleKey: "guide.home", contentKey: "guide.homeContent" },
  { id: "search", icon: Search, titleKey: "guide.search", contentKey: "guide.searchContent" },
  { id: "favorites", icon: Heart, titleKey: "guide.favorites", contentKey: "guide.favoritesContent" },
  { id: "settings", icon: Settings, titleKey: "guide.settings", contentKey: "guide.settingsContent" },
  { id: "permissions", icon: ShieldAlert, titleKey: "guide.permissions", contentKey: "guide.permissionsContent" },
  { id: "sleepTimer", icon: Moon, titleKey: "guide.sleepTimer", contentKey: "guide.sleepTimerContent" },
  { id: "recorder", icon: Rewind, titleKey: "guide.recorder", contentKey: "guide.recorderContent" },
  { id: "chromecast", icon: Cast, titleKey: "guide.chromecast", contentKey: "guide.chromecastContent" }
];
function UserGuideModal({ onReopenWelcome }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const toggle = (id) => setOpenSection((prev) => prev === id ? null : id);
  const handleReRequestPermissions = async () => {
    await requestAllPermissions();
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "w-full rounded-xl bg-accent p-4 mb-4 flex items-center gap-3 text-left transition-all hover:bg-accent/80", children: [
      /* @__PURE__ */ jsx(BookOpen, { className: "w-5 h-5 text-primary shrink-0" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-foreground", children: t("guide.button") }),
      /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground ml-auto -rotate-90" })
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-background border-border", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { className: "text-lg font-heading font-bold bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: t("guide.title") }) }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 mt-2", children: SECTIONS.map(({ id, icon: Icon, titleKey, contentKey }) => {
        const isOpen = openSection === id;
        const isPermissions = id === "permissions";
        const resolvedContentKey = isPermissions ? isMobile ? "guide.permissionsContentMobile" : "guide.permissionsContentDesktop" : contentKey;
        return /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-accent overflow-hidden", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => toggle(id),
              className: "w-full flex items-center gap-3 p-3.5 text-left",
              type: "button",
              children: [
                /* @__PURE__ */ jsx(Icon, { className: "w-4.5 h-4.5 text-primary shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-foreground flex-1", children: t(titleKey) }),
                /* @__PURE__ */ jsx(
                  ChevronDown,
                  {
                    className: cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-300",
                      isOpen && "rotate-180"
                    )
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
              ),
              children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed px-3.5 pb-2", children: t(resolvedContentKey) }),
                isPermissions && isOpen && isMobile && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 px-3.5 pb-3.5", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: handleReRequestPermissions,
                      className: "flex items-center gap-2 text-xs font-medium text-primary hover:underline",
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
                        t("guide.permissionsReRequest")
                      ]
                    }
                  ),
                  onReopenWelcome && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setOpen(false);
                        onReopenWelcome();
                      },
                      className: "flex items-center gap-2 text-xs font-medium text-primary hover:underline",
                      type: "button",
                      children: [
                        /* @__PURE__ */ jsx(Home, { className: "w-3.5 h-3.5" }),
                        t("guide.permissionsReopenWelcome")
                      ]
                    }
                  )
                ] }),
                id === "recorder" && isOpen && /* @__PURE__ */ jsxs("div", { className: "mx-3.5 mb-3 p-2.5 rounded-lg border border-border bg-accent/30", children: [
                  /* @__PURE__ */ jsxs("p", { className: "font-semibold text-foreground text-[11px] mb-1", children: [
                    "📱 ",
                    t("tbmQuota.title")
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground leading-relaxed", children: t("tbmQuota.description") })
                ] }),
                !isPermissions && id !== "recorder" && /* @__PURE__ */ jsx("div", { className: "pb-1.5" })
              ]
            }
          )
        ] }, id);
      }) })
    ] })
  ] });
}
const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(ScrollAreaPrimitive.Root, { ref, className: cn("relative overflow-hidden", className), ...props, children: [
  /* @__PURE__ */ jsx(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded-[inherit]", children }),
  /* @__PURE__ */ jsx(ScrollBar, {}),
  /* @__PURE__ */ jsx(ScrollAreaPrimitive.Corner, {})
] }));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsx(
  ScrollAreaPrimitive.ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ScrollAreaPrimitive.ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
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
function SettingsPage({ onReopenWelcome, onResetApp }) {
  const { language, setLanguage, t } = useTranslation();
  const { isActive, formattedTime, startTimer, cancelTimer } = useSleepTimer();
  const { favorites, importFavorites } = useFavoritesContext();
  const fileInputRef = useRef(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [unavailableStations, setUnavailableStations] = useState([]);
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);
  return /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-4 lg:px-8 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto min-h-full flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-6 mb-6", children: [
      /* @__PURE__ */ jsx(Settings, { className: "w-9 h-9 text-primary" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent drop-shadow-[0_0_12px_hsla(250,80%,60%,0.4)]", children: t("nav.settings") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-accent p-4 mb-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground mb-1", children: t("settings.language") }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-3", children: t("settings.languageDesc") }),
      /* @__PURE__ */ jsxs(Select, { value: language, onValueChange: (v) => setLanguage(v), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full rounded-lg bg-secondary text-foreground", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: LANGUAGE_OPTIONS.map((opt) => /* @__PURE__ */ jsx(SelectItem, { value: opt.value, children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("img", { src: opt.flagUrl, alt: opt.label, className: "w-5 h-4 object-cover rounded-sm" }),
          " ",
          opt.label
        ] }) }, opt.value)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      CollapsibleSection,
      {
        icon: Moon,
        title: t("sleepTimer.title"),
        badge: isActive ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 bg-primary/20 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono", children: [
          "⏱ ",
          formattedTime
        ] }) : null,
        children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-3", children: t("sleepTimer.desc") }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2 mb-3", children: SLEEP_TIMER_OPTIONS.map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                startTimer(opt.minutes);
              },
              className: cn(
                "py-2.5 rounded-lg text-xs font-semibold transition-all",
                "bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              ),
              children: t(`sleepTimer.${opt.minutes}`)
            },
            opt.minutes
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-3", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "1",
                max: "999",
                placeholder: t("sleepTimer.customPlaceholder"),
                value: customMinutes,
                onChange: (e) => setCustomMinutes(e.target.value),
                onClick: (e) => e.stopPropagation(),
                className: "flex-1 h-9 text-xs bg-secondary border-border"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: (e) => {
                  e.stopPropagation();
                  const mins = parseInt(customMinutes);
                  if (mins > 0) {
                    startTimer(mins);
                    setCustomMinutes("");
                  }
                },
                size: "sm",
                className: "h-9 px-4 text-xs font-semibold",
                disabled: !customMinutes || parseInt(customMinutes) <= 0,
                children: t("sleepTimer.customGo")
              }
            )
          ] }),
          isActive && /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: (e) => {
                e.stopPropagation();
                cancelTimer();
              },
              variant: "outline",
              size: "sm",
              className: "w-full rounded-lg border-destructive/30 text-destructive text-xs gap-1.5",
              children: [
                /* @__PURE__ */ jsx(TimerOff, { className: "w-3.5 h-3.5" }),
                t("sleepTimer.cancel")
              ]
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsx(CollapsibleSection, { icon: Heart, title: t("favorites.manage"), children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: async () => {
            if (favorites.length === 0) {
              toast({ title: t("favorites.noFavoritesToExport") });
              return;
            }
            const header = "name,streamUrl,country,tags,homepage";
            const rows = favorites.map(
              (s) => [s.name, s.streamUrl, s.country, s.tags.join(";"), s.homepage].map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")
            );
            const csv = [header, ...rows].join("\n");
            if (isNative()) {
              try {
                const [{ Filesystem, Directory }, { Share }] = await Promise.all([
                  import("@capacitor/filesystem"),
                  import("@capacitor/share")
                ]);
                const result = await Filesystem.writeFile({
                  path: "radiosphere_favorites.csv",
                  data: btoa(unescape(encodeURIComponent(csv))),
                  directory: Directory.Cache
                });
                await Share.share({ title: "RadioSphere.be Favorites", url: result.uri });
              } catch {
                toast({ title: `❌ ${t("favorites.importError")}`, variant: "destructive" });
              }
            } else {
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "radiosphere_favorites.csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 1e3);
              toast({ title: `✅ ${t("favorites.exported")}` });
            }
          },
          variant: "outline",
          size: "sm",
          className: "w-full rounded-lg text-xs gap-1.5",
          children: [
            /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
            t("favorites.export")
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: ".csv,text/csv",
          className: "hidden",
          onChange: (e) => {
            var _a;
            const file = (_a = e.target.files) == null ? void 0 : _a[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              var _a2;
              try {
                const text = (_a2 = ev.target) == null ? void 0 : _a2.result;
                const lines = text.split("\n").filter((l) => l.trim());
                const dataLines = lines.slice(1);
                const stations = dataLines.map((line, i) => {
                  const cols = [];
                  let current = "";
                  let inQuotes = false;
                  for (let j = 0; j < line.length; j++) {
                    const ch = line[j];
                    if (inQuotes) {
                      if (ch === '"' && line[j + 1] === '"') {
                        current += '"';
                        j++;
                      } else if (ch === '"') {
                        inQuotes = false;
                      } else {
                        current += ch;
                      }
                    } else {
                      if (ch === '"') {
                        inQuotes = true;
                      } else if (ch === ",") {
                        cols.push(current);
                        current = "";
                      } else {
                        current += ch;
                      }
                    }
                  }
                  cols.push(current);
                  return {
                    id: `import-${Date.now()}-${i}`,
                    name: cols[0] || "Unknown",
                    streamUrl: cols[1] || "",
                    country: cols[2] || "",
                    countryCode: "",
                    tags: cols[3] ? cols[3].split(";").filter(Boolean) : [],
                    language: "",
                    codec: "",
                    bitrate: 0,
                    votes: 0,
                    clickcount: 0,
                    logo: "",
                    homepage: cols[4] || ""
                  };
                }).filter((s) => s.streamUrl);
                const count = importFavorites(stations);
                toast({ title: `✅ ${count} ${t("favorites.imported")}` });
                if (count > 0) {
                  toast({ title: `🔄 ${t("favorites.refreshingMetadata")}` });
                  (async () => {
                    const notFound = [];
                    for (const station of stations) {
                      try {
                        const found = await searchStationByUrl(station.streamUrl);
                        if (found) {
                          importFavorites([{ ...found, id: found.id }]);
                        } else {
                          notFound.push(station);
                        }
                      } catch {
                        notFound.push(station);
                      }
                    }
                    toast({ title: `✅ ${t("favorites.metadataRefreshed")}` });
                    if (notFound.length > 0) {
                      setUnavailableStations(notFound);
                      setShowUnavailableDialog(true);
                    }
                  })();
                }
              } catch {
                toast({ title: `❌ ${t("favorites.importError")}`, variant: "destructive" });
              }
            };
            reader.readAsText(file);
            e.target.value = "";
          }
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: () => {
            var _a;
            return (_a = fileInputRef.current) == null ? void 0 : _a.click();
          },
          variant: "outline",
          size: "sm",
          className: "w-full rounded-lg text-xs gap-1.5",
          children: [
            /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5" }),
            t("favorites.import")
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: async () => {
            if (favorites.length === 0) {
              toast({ title: t("favorites.noFavoritesToExport") });
              return;
            }
            toast({ title: `🔄 ${t("favorites.refreshingMetadata")}` });
            const notFound = [];
            for (const station of favorites) {
              try {
                const found = await searchStationByUrl(station.streamUrl);
                if (found) {
                  importFavorites([{ ...found, id: found.id }]);
                } else {
                  notFound.push(station);
                }
              } catch {
                notFound.push(station);
              }
            }
            toast({ title: `✅ ${t("favorites.metadataRefreshed")}` });
            if (notFound.length > 0) {
              setUnavailableStations(notFound);
              setShowUnavailableDialog(true);
            }
          },
          variant: "outline",
          size: "sm",
          className: "w-full rounded-lg text-xs gap-1.5",
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
            t("favorites.refreshMetadata")
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx(UserGuideModal, { onReopenWelcome }),
    /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-8", children: [
      onResetApp && /* @__PURE__ */ jsxs(AlertDialog, { children: [
        /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-1.5 text-xs text-destructive hover:underline mb-4 mt-2 w-full", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }),
          t("settings.resetApp")
        ] }) }),
        /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
          /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsx(AlertDialogTitle, { children: t("settings.resetApp") }),
            /* @__PURE__ */ jsx(AlertDialogDescription, { children: t("settings.resetConfirm") })
          ] }),
          /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
            /* @__PURE__ */ jsx(AlertDialogCancel, { children: t("common.cancel") }),
            /* @__PURE__ */ jsx(AlertDialogAction, { onClick: onResetApp, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: t("settings.resetButton") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(AboutFooter, {})
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showUnavailableDialog, onOpenChange: setShowUnavailableDialog, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-sm rounded-xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-sm", children: t("favorites.unavailableStations") }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-xs", children: t("favorites.unavailableDesc") })
      ] }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-60", children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: unavailableStations.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-secondary/50", children: [
        /* @__PURE__ */ jsx(Wifi, { className: "w-3.5 h-3.5 text-destructive shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium truncate", children: s.name }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground truncate", children: s.streamUrl })
        ] })
      ] }, i)) }) }),
      /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", className: "w-full text-xs", children: t("favorites.understood") }) }) })
    ] }) })
  ] }) });
}
export {
  SettingsPage
};
