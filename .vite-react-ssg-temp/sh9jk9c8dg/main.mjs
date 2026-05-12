var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import * as ReactDOM from "react-dom";
import { Head, ViteReactSSG } from "vite-react-ssg";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import React__default, { createContext, useContext, useState, useEffect, startTransition, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, ShieldAlert, Home, Compass, Heart, Info, Cast, Loader2, Pause, Play, Clock, Download, Radio, ChevronDown, Rewind, Square, Circle, FastForward, Share2, Volume2, ChevronRight, ChevronLeft, HelpCircle, ExternalLink, Mail, Settings, Maximize2, VolumeX, ShieldCheck, Gift, ShieldOff, MapPin, Sparkles, RefreshCw, ArrowUp, ChevronUp, Check, Moon, Globe, Search, Music, AlertTriangle, Copy } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "next-themes";
import { Toaster as Toaster$2, toast as toast$1 } from "sonner";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Slot } from "@radix-ui/react-slot";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
function trunc$1(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) : s;
}
function umamiTrack$2(event, data) {
  var _a;
  try {
    (_a = window.umami) == null ? void 0 : _a.track(event, data);
  } catch {
  }
}
function firstComponentFrame(stack) {
  if (!stack) return "";
  for (const raw of stack.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^at\s+([A-Za-z0-9_$.]+)/.exec(line);
    if (!m) continue;
    const name = m[1];
    if (/^[a-z]/.test(name)) continue;
    return name;
  }
  return "";
}
if (typeof window !== "undefined") {
  const RD = ReactDOM;
  const original = RD.hydrateRoot;
  if (typeof original === "function") {
    RD.hydrateRoot = function patchedHydrateRoot(container, children, options) {
      const userOpts = options ?? {};
      const merged = {
        ...userOpts,
        onRecoverableError(error, errorInfo) {
          var _a;
          try {
            const err = error;
            const message = typeof err === "string" ? err : err instanceof Error || err && typeof err.message === "string" ? err.message ?? String(err) : String(err);
            const codeMatch = /Minified React error #(\d+)/.exec(message ?? "");
            const code = codeMatch ? codeMatch[1] : "";
            const componentStack = trunc$1(errorInfo == null ? void 0 : errorInfo.componentStack, 2e3);
            const culprit = firstComponentFrame(errorInfo == null ? void 0 : errorInfo.componentStack);
            umamiTrack$2(code ? `hydration-recoverable-${code}` : "hydration-recoverable", {
              code: code || "unknown",
              culprit,
              digest: (errorInfo == null ? void 0 : errorInfo.digest) ?? "",
              message: trunc$1(message, 300),
              componentStack,
              stack: trunc$1(err == null ? void 0 : err.stack, 600),
              route: window.location.pathname,
              url: code ? `https://react.dev/errors/${code}` : "",
              ua: trunc$1(navigator.userAgent, 160),
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              dpr: window.devicePixelRatio,
              lang: navigator.language
            });
          } catch {
          }
          try {
            (_a = userOpts.onRecoverableError) == null ? void 0 : _a.call(userOpts, error, errorInfo);
          } catch {
          }
        }
      };
      return original.call(this, container, children, merged);
    };
    console.log("[RadioSphere] hydrateRoot patched for diagnostic capture");
  } else {
    console.warn("[RadioSphere] hydrateRoot patch skipped (not found on react-dom)");
  }
}
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1e6;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
const toastTimeouts = /* @__PURE__ */ new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t)
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId })
  };
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(ToastPrimitives.Root, { ref, className: cn(toastVariants({ variant }), className), ...props });
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Title, { ref, className: cn("text-sm font-semibold", className), ...props }));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Description, { ref, className: cn("text-sm opacity-90", className), ...props }));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
function Toaster$1() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$2,
    {
      theme,
      position: "top-center",
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
const LANGUAGE_OPTIONS = [
  { value: "fr", flag: "🇫🇷", flagUrl: "https://flagcdn.com/w40/fr.png", label: "Français" },
  { value: "en", flag: "🇬🇧", flagUrl: "https://flagcdn.com/w40/gb.png", label: "English" },
  { value: "es", flag: "🇪🇸", flagUrl: "https://flagcdn.com/w40/es.png", label: "Español" },
  { value: "de", flag: "🇩🇪", flagUrl: "https://flagcdn.com/w40/de.png", label: "Deutsch" },
  { value: "it", flag: "🇮🇹", flagUrl: "https://flagcdn.com/w40/it.png", label: "Italiano" },
  { value: "nl", flag: "🇳🇱", flagUrl: "https://flagcdn.com/w40/nl.png", label: "Nederlands" },
  { value: "pt", flag: "🇵🇹", flagUrl: "https://flagcdn.com/w40/pt.png", label: "Português" },
  { value: "pt-BR", flag: "🇧🇷", flagUrl: "https://flagcdn.com/w40/br.png", label: "Português (Brasil)" },
  { value: "hi", flag: "🇮🇳", flagUrl: "https://flagcdn.com/w40/in.png", label: "हिन्दी" },
  { value: "pl", flag: "🇵🇱", flagUrl: "https://flagcdn.com/w40/pl.png", label: "Polski" },
  { value: "zh", flag: "🇨🇳", flagUrl: "https://flagcdn.com/w40/cn.png", label: "中文" },
  { value: "ja", flag: "🇯🇵", flagUrl: "https://flagcdn.com/w40/jp.png", label: "日本語" },
  { value: "tr", flag: "🇹🇷", flagUrl: "https://flagcdn.com/w40/tr.png", label: "Türkçe" },
  { value: "ru", flag: "🇷🇺", flagUrl: "https://flagcdn.com/w40/ru.png", label: "Русский" },
  { value: "id", flag: "🇮🇩", flagUrl: "https://flagcdn.com/w40/id.png", label: "Bahasa Indonesia" },
  { value: "ms", flag: "🇲🇾", flagUrl: "https://flagcdn.com/w40/my.png", label: "Bahasa Malaysia" },
  { value: "th", flag: "🇹🇭", flagUrl: "https://flagcdn.com/w40/th.png", label: "ภาษาไทย" },
  { value: "ar", flag: "🇸🇦", flagUrl: "https://flagcdn.com/w40/sa.png", label: "العربية" }
];
const translations = {
  fr: {
    "nav.home": "Accueil",
    "nav.search": "Recherche",
    "nav.explore": "Rechercher et explorer",
    "nav.favorites": "Favoris",
    "nav.premium": "Premium",
    "nav.settings": "Réglages",
    "nav.about": "À propos",
    "sidebar.stationCount": "Plus de 50 000 stations radio à travers 230+ pays, gratuitement, sans inscription, sans publicités ajoutées.",
    "sidebar.tbmTeaser": "Notre exclusivité : la TimeBack Machine — rembobinez le direct radio, réécoutez les 5 dernières minutes, enregistrez vos émissions en MP3. Le lecteur radio en ligne qui vous permet de remonter le temps.",
    "sidebar.tbmHowItWorks": "Comment ça marche ?",
    "sidebar.podcastTeaser": "Envie d'un podcast ?",
    "tbmModal.title": "TimeBack Machine — Comment ça marche ?",
    "tbmModal.intro": "La TimeBack Machine est une fonctionnalité exclusive de RadioSphere.be qui révolutionne l'écoute de la radio en ligne. Fini de rater un moment important en direct !",
    "tbmModal.bufferTitle": "🔄 Le buffer intelligent (5 minutes)",
    "tbmModal.bufferDesc": "Dès que vous écoutez une station, RadioSphere.be enregistre automatiquement les 5 dernières minutes en arrière-plan dans un buffer circulaire. Vous n'avez rien à activer : c'est automatique et transparent.",
    "tbmModal.rewindTitle": "⏪ Rembobiner le direct",
    "tbmModal.rewindDesc": "Vous avez manqué une info, une chanson, un moment marquant ? Ouvrez la TimeBack Machine et rembobinez jusqu'à 5 minutes en arrière. Utilisez les boutons -15s/+15s ou glissez sur la timeline pour naviguer précisément.",
    "tbmModal.recordTitle": "🔴 Enregistrer en MP3",
    "tbmModal.recordDesc": "Appuyez sur REC pour capturer jusqu'à 10 minutes d'antenne en MP3, directement depuis le lecteur. Parfait pour sauvegarder une interview, un morceau ou une émission entière.",
    "tbmModal.iconTitle": "💡 L'icône TBM clignotante",
    "tbmModal.iconDesc": "Quand l'icône TBM clignote dans le lecteur, cela signifie que le buffer est actif et enregistre en continu. Cliquez dessus pour ouvrir la TimeBack Machine et accéder à vos dernières minutes d'écoute.",
    "tbmModal.liveTitle": "📡 Retour au direct",
    "tbmModal.liveDesc": "À tout moment, appuyez sur « EN DIRECT » pour revenir instantanément au flux live de votre station.",
    "tbmModal.close": "J'ai compris",
    "app.downloadTitle": "Application Mobile",
    "app.downloadDesc": "Écoutez vos radios partout avec l'app Android.",
    "app.downloadBtn": "Bientôt disponible",
    "footer.tagline": "Le web player premium pour écouter des milliers de stations radio du monde entier.",
    "footer.links": "Liens utiles",
    "footer.contact": "Contact",
    "footer.rights": "Tous droits réservés.",
    "privacy.title": "Politique de confidentialité",
    "privacy.lastUpdated": "Dernière mise à jour",
    "privacy.dataCollection": "Collecte de données",
    "privacy.dataCollectionDesc": "RadioSphere.be ne collecte aucune donnée personnelle identifiable. Aucune inscription n'est requise pour utiliser le service. Nous ne suivons pas vos habitudes d'écoute et ne partageons aucune information avec des tiers.",
    "privacy.localStorage": "Stockage local",
    "privacy.localStorageDesc": "Toutes les données sont stockées exclusivement sur votre appareil via le stockage local du navigateur :",
    "privacy.localStorageFavorites": "Vos stations favorites",
    "privacy.localStorageLang": "Votre préférence de langue",
    "privacy.localStorageRecent": "Vos stations écoutées récemment",
    "privacy.localStoragePrefs": "Vos paramètres d'interface",
    "privacy.analytics": "Mesure d'audience (Umami Analytics)",
    "privacy.analyticsDesc": "Nous utilisons Umami Analytics, une solution de mesure d'audience respectueuse de la vie privée et conforme au RGPD. Umami ne collecte aucune donnée personnelle identifiable, n'utilise aucun cookie, et toutes les données sont anonymisées. Nous mesurons uniquement des statistiques d'utilisation globales (pages visitées, fonctionnalités utilisées) pour améliorer le service. Umami est hébergé sur leurs serveurs sécurisés dans le cloud.",
    "privacy.analyticsNoCookies": "Aucun cookie de suivi n'est déposé",
    "privacy.analyticsAnonymous": "Données entièrement anonymisées",
    "privacy.analyticsGDPR": "Conforme au RGPD européen",
    "privacy.analyticsNoPersonal": "Aucune donnée personnelle identifiable collectée",
    "privacy.analyticsLearnMore": "En savoir plus sur la politique de confidentialité d'Umami",
    "privacy.thirdParty": "Services tiers",
    "privacy.thirdPartyDesc": "Les flux audio sont fournis directement par les stations de radio via l'API communautaire Radio Browser (radio-browser.info). RadioSphere.be ne contrôle pas le contenu diffusé par ces stations. Les flux audio peuvent contenir des publicités insérées directement par les stations émettrices — RadioSphere.be n'a aucun moyen de les filtrer ou de les bloquer.",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) est utilisé pour mesurer l'audience du site de manière anonyme. Aucun cookie n'est déposé, aucune donnée personnelle n'est collectée. Seules des statistiques agrégées et anonymes sont générées.",
    "privacy.permissions": "Navigateur web",
    "privacy.permissionsDesc": "RadioSphere.be est un site web accessible depuis tout navigateur moderne. Aucune installation n'est requise. Le site n'utilise pas de cookies tiers. Seul le stockage local (localStorage) de votre navigateur est utilisé pour mémoriser vos préférences.",
    "privacy.security": "Sécurité",
    "privacy.securityDesc": "Comme aucune donnée personnelle n'est collectée ni transmise, le risque de fuite de données est inexistant. Vos favoris et préférences ne quittent jamais votre appareil.",
    "privacy.contact": "Contact",
    "privacy.contactDesc": "Pour toute question relative à cette politique de confidentialité, vous pouvez nous contacter à :",
    "player.selectStation": "Sélectionnez une station pour commencer",
    "home.greeting": "Bonjour 👋",
    "home.recentlyPlayed": "Écoutées récemment",
    "home.popularStations": "Stations populaires",
    "home.localPopular": "Stations populaires",
    "home.exploreByGenre": "Explorer par genre",
    "home.yourFavorites": "Vos favoris",
    "home.weeklyDiscoveries": "Découvertes de la semaine",
    "home.popularNearYou": "Populaires près de chez vous",
    "home.noFavorites": "Ajoutez des favoris pour les retrouver ici",
    "search.title": "Recherche",
    "search.placeholder": "Rechercher une station...",
    "search.country": "Pays",
    "search.selectCountry": "Choisir un pays",
    "search.clearCountry": "Effacer le pays",
    "search.resetFilters": "Réinitialiser les filtres",
    "search.notFoundTitle": "Vous n'avez pas trouvé votre station préférée ?",
    "search.notFoundAddOn": "Vous pouvez l'ajouter directement sur",
    "search.notFoundEmailUs": "Nous pouvons aussi essayer de l'ajouter pour vous : envoyez-nous un email à",
    "inAppBrowser.warning": "Pour une meilleure expérience, ouvrez RadioSphere.be dans votre navigateur habituel.",
    "inAppBrowser.openExternal": "Ouvrir dans le navigateur",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Aucun résultat trouvé",
    "search.networkError": "Erreur réseau. Impossible de contacter le serveur de stations.",
    "search.countriesError": "Impossible de charger la liste des pays.",
    "search.retry": "Réessayer",
    "search.useFilters": "Utilisez la recherche ou les filtres pour trouver des stations",
    "search.genre": "Genre",
    "search.language": "Langue",
    "search.loadMore": "Plus de stations",
    "search.loadingMore": "Chargement...",
    "search.sortPopularity": "Popularité",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Clicks",
    "search.resultsCount": "stations trouvées",
    "favorites.title": "Favoris",
    "favorites.empty": "Aucun favori",
    "favorites.emptyDesc": "Appuyez sur le cœur d'une station pour l'ajouter à vos favoris",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Par pays",
    "favorites.unknownCountry": "Pays inconnu",
    "favorites.sortGenre": "Par genre",
    "favorites.unknownGenre": "Genre inconnu",
    "favorites.viewList": "Liste",
    "favorites.viewMedium": "Vignettes",
    "favorites.viewLarge": "Grandes vignettes",
    "favorites.viewSmall": "Mini vignettes",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "L'expérience radio ultime",
    "premium.active": "Premium actif",
    "premium.sleepTimer": "Minuterie de sommeil",
    "premium.sleepTimerDesc": "Arrêt automatique de la lecture après un délai configurable",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Contrôlez RadioSphere.be directement depuis Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Diffusez vos stations sur votre TV ou enceinte connectée via Chromecast",
    "premium.recorder": "Magnétophone",
    "premium.recorderDesc": "Enregistrez vos émissions en MP3 et rembobinez jusqu'à 5 minutes en arrière",
    "premium.monthly": "Achat unique — 9,99€",
    "premium.buyLifetime": "Débloquer à vie",
    "premium.priceNote": "Prix indicatif. Le montant final peut varier selon votre pays.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Restaurer l'achat",
    "premium.disclaimer": "Achat unique, accès à vie. Pas d'abonnement.",
    "premium.comingSoon": "Arrive bientôt",
    "premium.passwordPlaceholder": "Entrez le code d'accès",
    "premium.unlock": "Déverrouiller",
    "premium.lock": "Verrouiller Premium",
    "premium.wrongPassword": "Code incorrect",
    "premium.unlocked": "Premium déverrouillé !",
    "sleepTimer.title": "Minuterie de sommeil",
    "sleepTimer.desc": "Arrête automatiquement la lecture après un délai",
    "sleepTimer.off": "Désactivée",
    "sleepTimer.active": "Actif",
    "sleepTimer.remaining": "Restant",
    "sleepTimer.cancel": "Annuler la minuterie",
    "sleepTimer.stopped": "La lecture a été mise en pause automatiquement.",
    "sleepTimer.custom": "Personnalisé",
    "sleepTimer.customPlaceholder": "Minutes",
    "sleepTimer.customGo": "Go",
    "sleepTimer.15": "15 min",
    "sleepTimer.30": "30 min",
    "sleepTimer.45": "45 min",
    "sleepTimer.60": "1 heure",
    "sleepTimer.90": "1h30",
    "sleepTimer.120": "2 heures",
    "player.nowPlaying": "En cours de lecture",
    "player.streamError": "Erreur de lecture",
    "player.streamErrorDesc": "Impossible de lire ce flux. Essayez une autre station.",
    "player.error": "Erreur",
    "player.streamUnavailable": "Cette station n'a pas d'URL de flux.",
    "player.visitWebsite": "Visiter le site",
    "player.timeout": "Délai dépassé",
    "player.timeoutDesc": "Le flux ne répond pas. Essayez une autre station.",
    "player.unexpectedError": "Erreur inattendue",
    "player.unexpectedErrorDesc": "Une erreur est survenue. Réessayez.",
    "ssl.title": "Connexion non sécurisée",
    "ssl.description": "utilise une connexion non chiffrée (HTTP). Ce problème provient du serveur de la radio, pas de RadioSphere.be. Vos données pourraient être interceptées.",
    "ssl.technical": "Le flux audio de cette station ne respecte pas les standards de chiffrement SSL/TLS actuels. RadioSphere.be ne peut pas garantir la sécurité de cette connexion.",
    "ssl.acceptRisk": "Écouter à mes risques",
    "exit.title": "Fermer l'application ?",
    "exit.description": "Appuyez une fois de plus pour quitter RadioSphere.",
    "exit.confirm": "Quitter",
    "common.cancel": "Annuler",
    "settings.title": "Réglages",
    "settings.language": "Langue",
    "settings.languageDesc": "Choisissez la langue de l'interface",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Utilisation des données",
    "settings.dataWarningDesc": "L'écoute de stations de radio utilise votre connexion internet et peut consommer des données mobiles. Nous recommandons une connexion Wi-Fi pour une utilisation prolongée.",
    "settings.dataDisclaimer": "Données locales",
    "settings.dataDisclaimerDesc": "Vos favoris et préférences sont stockés localement sur votre appareil. Aucune donnée personnelle n'est envoyée à un serveur.",
    "settings.radioSource": "Source des stations",
    "settings.radioSourceDesc": "La liste des stations est fournie par Radio Browser, une API communautaire libre et gratuite qui recense plus de 50 000 radios à travers le monde.",
    "settings.radioSourceLink": "Visiter Radio Browser",
    "settings.radioSourceAddStation": "Ajouter une station",
    "settings.analytics": "Mesure d'audience",
    "settings.analyticsDesc": "RadioSphere.be utilise Umami Analytics, une solution de mesure d'audience respectueuse de la vie privée et conforme au RGPD.",
    "settings.analyticsNoCookies": "Aucun cookie de suivi",
    "settings.analyticsAnonymous": "Données entièrement anonymisées",
    "settings.analyticsGDPR": "Conforme au RGPD européen",
    "settings.analyticsUsage": "Mesure uniquement l'utilisation globale (pages vues, fonctionnalités utilisées)",
    "settings.analyticsLearnMore": "En savoir plus sur Umami",
    "favorites.manage": "Gérer les favoris",
    "favorites.export": "Exporter en CSV",
    "favorites.import": "Importer un CSV",
    "favorites.share": "Partager mes favoris",
    "favorites.exported": "Favoris exportés",
    "favorites.imported": "favoris importés",
    "favorites.importError": "Erreur lors de l'import",
    "favorites.refreshingMetadata": "Récupération des métadonnées...",
    "favorites.metadataRefreshed": "Métadonnées mises à jour",
    "favorites.unavailableStations": "Stations introuvables",
    "favorites.unavailableDesc": "Ces stations ne sont plus répertoriées sur Radio Browser et pourraient ne plus être disponibles :",
    "favorites.understood": "Compris",
    "favorites.noFavoritesToExport": "Aucun favori à exporter",
    "favorites.refreshMetadata": "Mettre à jour les métadonnées",
    "settings.privacyPolicy": "Politique de confidentialité",
    "settings.reopenWelcome": "Revoir la page de bienvenue",
    "settings.resetApp": "Réinitialiser l'application",
    "settings.resetAppDesc": "Supprimer tous les favoris, stations récentes et préférences",
    "settings.resetConfirm": "Êtes-vous sûr ? Cette action est irréversible.",
    "settings.resetDone": "Application réinitialisée",
    "settings.resetButton": "Tout supprimer",
    "premium.restorePurchases": "Restaurer les achats",
    "premium.restoreSuccess": "Achats restaurés avec succès",
    "premium.restoreNone": "Aucun achat à restaurer",
    "guide.title": "Mode d'emploi",
    "guide.button": "Mode d'emploi",
    "guide.home": "Accueil",
    "guide.homeContent": "L'écran d'accueil affiche vos stations écoutées récemment, les stations populaires, vos favoris en accès rapide, les découvertes de la semaine et l'exploration par genre musical.",
    "guide.search": "Recherche",
    "guide.searchContent": "Recherchez une station par nom, puis filtrez par pays, genre ou langue. Triez les résultats par popularité, ordre alphabétique ou nombre de clics. Chargez plus de résultats en bas de page.",
    "guide.favorites": "Favoris",
    "guide.favoritesContent": "Appuyez sur le cœur d'une station pour l'ajouter à vos favoris. Depuis les réglages, vous pouvez exporter vos favoris en CSV, en importer, ou les partager.",
    "guide.settings": "Réglages",
    "guide.settingsContent": "Changez la langue de l'interface, activez la minuterie de sommeil, gérez vos favoris (export/import/partage), consultez les informations sur la source des stations et la politique de confidentialité.",
    "guide.permissions": "Autorisations",
    "guide.permissionsContent": "RadioSphere.be demande quelques autorisations pour fonctionner pleinement : les notifications permettent d'afficher les contrôles de lecture sur l'écran verrouillé ; la localisation est nécessaire pour détecter les appareils Chromecast à proximité ; l'accès au stockage permet de sauvegarder vos enregistrements sur votre téléphone. Aucune donnée personnelle n'est collectée ni envoyée. Si vous avez refusé une autorisation par erreur, vous pouvez la redemander ci-dessous ou recharger la page de bienvenue.",
    "guide.permissionsContentDesktop": "Sur la version web, RadioSphere.be ne demande aucune autorisation système : la lecture audio fonctionne nativement dans votre navigateur. Aucune donnée personnelle n'est collectée. Pour profiter des contrôles sur l'écran verrouillé, du Chromecast intégré et de l'enregistrement local, installez l'application Android gratuite depuis Google Play.",
    "guide.permissionsContentMobile": "Sur votre téléphone, RadioSphere.be (web) peut demander l'autorisation d'afficher des notifications pour les contrôles de lecture. Pour aller plus loin (Chromecast, enregistrements stockés sur l'appareil, contrôle sur l'écran verrouillé), installez l'application Android gratuite depuis Google Play.",
    "guide.permissionsReRequest": "Redemander les autorisations",
    "guide.permissionsReopenWelcome": "Recharger la page de bienvenue",
    "guide.sleepTimer": "Minuterie de sommeil",
    "guide.sleepTimerContent": "Programmez l'arrêt automatique de la lecture après un délai de votre choix (15 min à 2 h ou durée personnalisée). Idéal pour s'endormir avec la radio. Activez-la depuis les Réglages.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Enregistrez vos émissions préférées en MP3 directement depuis le lecteur plein écran. Le buffer de 5 minutes vous permet aussi de rembobiner et réécouter ce que vous venez de manquer. Appuyez sur REC pour lancer l'enregistrement (10 min max). Lorsque l'icône TBM clignote, cela signifie que le buffer est actif et enregistre en arrière-plan. Cliquez sur l'icône clignotante pour accéder au lecteur TimeBack et réécouter les dernières minutes.",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Diffusez vos stations de radio sur votre téléviseur ou enceinte connectée via Chromecast. Appuyez sur l'icône Cast dans le lecteur pour commencer la diffusion.",
    "welcome.subtitle": "La radio mondiale à portée de main",
    "welcome.chooseLanguage": "Choisissez la langue",
    "welcome.start": "Commencer",
    "welcome.stations": "50 000+ stations",
    "welcome.search": "Recherche avancée",
    "welcome.favExport": "Favoris & export",
    "welcome.genres": "25 genres musicaux",
    "welcome.sleepTimer": "Minuterie de sommeil",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Réécoutez le direct",
    "genre.60s": "60s",
    "genre.70s": "70s",
    "genre.80s": "80s",
    "genre.90s": "90s",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Classique",
    "genre.country": "Country",
    "genre.electronic": "Électronique",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latin",
    "genre.metal": "Metal",
    "genre.news": "Actualités",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Diffusion sur",
    "cast.controlFromPhone": "Contrôlez depuis votre téléphone",
    "cast.connected": "Connecté",
    "cast.disconnected": "Déconnecté",
    "cast.unsupportedBrowser": "Chromecast est disponible dans Google Chrome ou l'application Android.",
    "cast.openInChrome": "Ouvrez dans Chrome pour utiliser Chromecast",
    "player.live": "DIRECT",
    "player.recording": "Enregistrement",
    "player.recordingStarted": "Enregistrement démarré",
    "player.recordingStopped": "Enregistrement terminé",
    "player.recordingMaxReached": "Durée maximale atteinte (10 min)",
    "player.saveRecording": "Sauvegarder sur le téléphone",
    "player.shareRecording": "Partager l'enregistrement",
    "player.returnToLive": "Retour au direct",
    "player.recordPremiumOnly": "L'enregistrement est une fonctionnalité Premium",
    "player.backInTime": "Retour dans le passé",
    "player.bufferLoading": "Chargement du buffer...",
    "player.recordingNotAvailable": "Enregistrement indisponible",
    "player.recordingContinuesLive": "Retour au direct, enregistrement en cours...",
    "player.fileSaved": "Fichier sauvegardé !",
    "player.codec": "Codec",
    "player.bitrate": "Débit",
    "player.language": "Langue",
    "player.noStreamInfo": "Aucune info relayée par le stream ou Radio Browser",
    "onboarding.title": "Bienvenue sur RadioSphere.be",
    "onboarding.free": "100% Gratuit",
    "onboarding.freeDesc": "Accès illimité sans abonnement",
    "onboarding.noAds": "Zéro Pub Ajoutée",
    "onboarding.noAdsDesc": "Aucune pub ajoutée par RadioSphere.be. Les stations peuvent inclure leurs propres annonces dans leur flux.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Rembobinez le direct radio",
    "onboarding.cta": "Bientôt disponible sur Google Play",
    "onboarding.dismiss": "Ne plus afficher",
    "tbmQuota.title": "Envie de remonter le temps sans limite ?",
    "tbmQuota.description": "Sur le web, la TimeBack Machine est limitée : rembobinage jusqu'à 2 minutes en arrière et enregistrement jusqu'à 5 minutes maximum, avec un quota global de 10 min/jour sur mobile pour garantir la stabilité. La version premium disponible sur Google Play permet de remonter jusqu'à 5 minutes en arrière et d'enregistrer jusqu'à 30 minutes, sans quota.",
    "tbmQuota.cta": "Télécharger sur Google Play",
    "tbmQuota.continueLive": "Continuer en direct",
    "tbmQuota.warning": "Profitez de la TimeBack Machine en illimité sur notre application !",
    "home.androidTitle": "RadioSphere.be sur Android",
    "home.androidDesc": "Écoutez vos stations préférées partout, avec Android Auto, Chromecast et la TimeBack Machine.",
    "home.comingSoon": "Bientôt disponible",
    "notFound.message": "Oups ! Page introuvable",
    "notFound.backHome": "Retour à l'accueil",
    "footer.poweredByPrefix": "Propulsé par l'incroyable ",
    "footer.poweredBySuffix": ". Merci à Alex Segler pour ce projet communautaire.",
    "footer.createdBy": "Créé par Franck Malherbe",
    "aria.play": "Lire",
    "aria.pause": "Mettre en pause",
    "aria.addFavorite": "Ajouter aux favoris",
    "aria.removeFavorite": "Retirer des favoris",
    "aria.close": "Fermer",
    "aria.refresh": "Rafraîchir"
  },
  en: {
    "nav.home": "Home",
    "nav.search": "Search",
    "nav.explore": "Search & Explore",
    "nav.favorites": "Favorites",
    "nav.premium": "Premium",
    "nav.settings": "Settings",
    "nav.about": "About",
    "sidebar.stationCount": "Over 50,000 radio stations across 230+ countries, free, no sign-up required, no added ads.",
    "sidebar.tbmTeaser": "Our exclusive feature: the TimeBack Machine — rewind live radio, relisten to the last 5 minutes, record your shows as MP3. The online radio player that lets you turn back time.",
    "sidebar.tbmHowItWorks": "How does it work?",
    "sidebar.podcastTeaser": "In the mood for a podcast?",
    "tbmModal.title": "TimeBack Machine — How does it work?",
    "tbmModal.intro": "The TimeBack Machine is a RadioSphere.be exclusive that revolutionizes online radio listening. Never miss an important live moment again!",
    "tbmModal.bufferTitle": "🔄 Smart buffer (5 minutes)",
    "tbmModal.bufferDesc": "As soon as you listen to a station, RadioSphere.be automatically records the last 5 minutes in a circular buffer. You don't need to activate anything: it's automatic and seamless.",
    "tbmModal.rewindTitle": "⏪ Rewind live radio",
    "tbmModal.rewindDesc": "Missed a news flash, a song, or a key moment? Open the TimeBack Machine and rewind up to 5 minutes. Use the -15s/+15s buttons or drag the timeline to navigate precisely.",
    "tbmModal.recordTitle": "🔴 Record as MP3",
    "tbmModal.recordDesc": "Tap REC to capture up to 10 minutes of broadcast as MP3, directly from the player. Perfect for saving interviews, tracks, or entire shows.",
    "tbmModal.iconTitle": "💡 The blinking TBM icon",
    "tbmModal.iconDesc": "When the TBM icon blinks in the player, it means the buffer is active and continuously recording. Tap it to open the TimeBack Machine and access your last few minutes of listening.",
    "tbmModal.liveTitle": "📡 Back to live",
    "tbmModal.liveDesc": "At any time, tap 'LIVE' to instantly return to the live stream of your station.",
    "tbmModal.close": "Got it",
    "app.downloadTitle": "Mobile App",
    "app.downloadDesc": "Listen to your radios everywhere with the Android app.",
    "app.downloadBtn": "Coming soon",
    "footer.tagline": "The premium web player for listening to thousands of radio stations worldwide.",
    "footer.links": "Useful links",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved.",
    "privacy.title": "Privacy Policy",
    "privacy.lastUpdated": "Last updated",
    "privacy.dataCollection": "Data Collection",
    "privacy.dataCollectionDesc": "RadioSphere.be does not collect any personally identifiable data. No registration is required to use the service. We do not track your listening habits and do not share any information with third parties.",
    "privacy.localStorage": "Local Storage",
    "privacy.localStorageDesc": "All data is stored exclusively on your device via browser local storage:",
    "privacy.localStorageFavorites": "Your favorite stations",
    "privacy.localStorageLang": "Your language preference",
    "privacy.localStorageRecent": "Your recently played stations",
    "privacy.localStoragePrefs": "Your interface settings",
    "privacy.analytics": "Audience Measurement (Umami Analytics)",
    "privacy.analyticsDesc": "We use Umami Analytics, a privacy-friendly and GDPR-compliant analytics solution. Umami collects no personally identifiable data, uses no cookies, and all data is anonymized. We only track aggregate usage statistics (pages visited, features used) to improve the service. Umami is hosted on their secure cloud servers.",
    "privacy.analyticsNoCookies": "No tracking cookies are used",
    "privacy.analyticsAnonymous": "Fully anonymized data",
    "privacy.analyticsGDPR": "GDPR compliant",
    "privacy.analyticsNoPersonal": "No personally identifiable data collected",
    "privacy.analyticsLearnMore": "Learn more about Umami's privacy policy",
    "privacy.thirdParty": "Third-Party Services",
    "privacy.thirdPartyDesc": "Audio streams are provided directly by radio stations via the community API Radio Browser (radio-browser.info). RadioSphere.be does not control the content broadcast by these stations. Audio streams may contain advertisements inserted directly by the broadcasting stations — RadioSphere.be has no way to filter or block them.",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) is used to measure website traffic anonymously. No cookies are used, no personal data is collected. Only aggregated and anonymous statistics are generated.",
    "privacy.permissions": "Web Browser",
    "privacy.permissionsDesc": "RadioSphere.be is a website accessible from any modern browser. No installation is required. The site does not use third-party cookies. Only your browser's local storage (localStorage) is used to remember your preferences.",
    "privacy.security": "Security",
    "privacy.securityDesc": "Since no personal data is collected or transmitted, the risk of data leaks is nonexistent. Your favorites and preferences never leave your device.",
    "privacy.contact": "Contact",
    "privacy.contactDesc": "For any questions regarding this privacy policy, you can contact us at:",
    "player.selectStation": "Select a station to start listening",
    "home.greeting": "Hello 👋",
    "home.recentlyPlayed": "Recently played",
    "home.popularStations": "Popular stations",
    "home.localPopular": "Popular stations",
    "home.exploreByGenre": "Explore by genre",
    "home.yourFavorites": "Your favorites",
    "home.weeklyDiscoveries": "Weekly discoveries",
    "home.popularNearYou": "Popular near you",
    "home.noFavorites": "Add favorites to see them here",
    "search.title": "Search",
    "search.placeholder": "Search for a station...",
    "search.country": "Country",
    "search.selectCountry": "Select a country",
    "search.clearCountry": "Clear country",
    "search.resetFilters": "Reset filters",
    "search.notFoundTitle": "Can't find your favorite station?",
    "search.notFoundAddOn": "You can add it directly on",
    "search.notFoundEmailUs": "We can also try to add it for you: send us an email at",
    "inAppBrowser.warning": "For a better experience, open RadioSphere.be in your regular browser.",
    "inAppBrowser.openExternal": "Open in browser",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "No results found",
    "search.networkError": "Network error. Unable to reach the station server.",
    "search.countriesError": "Unable to load the country list.",
    "search.retry": "Retry",
    "search.useFilters": "Use the search bar or filters to find stations",
    "search.genre": "Genre",
    "search.language": "Language",
    "search.loadMore": "More stations",
    "search.loadingMore": "Loading...",
    "search.sortPopularity": "Popularity",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Clicks",
    "search.resultsCount": "stations found",
    "favorites.title": "Favorites",
    "favorites.empty": "No favorites",
    "favorites.emptyDesc": "Tap the heart on a station to add it to your favorites",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "By country",
    "favorites.unknownCountry": "Unknown country",
    "favorites.sortGenre": "By genre",
    "favorites.unknownGenre": "Unknown genre",
    "favorites.viewList": "List",
    "favorites.viewMedium": "Thumbnails",
    "favorites.viewLarge": "Large thumbnails",
    "favorites.viewSmall": "Small thumbnails",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "The ultimate radio experience",
    "premium.active": "Premium active",
    "premium.sleepTimer": "Sleep Timer",
    "premium.sleepTimerDesc": "Automatically stops playback after a configurable delay",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Control RadioSphere.be directly from Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Cast your stations to your TV or connected speaker via Chromecast",
    "premium.recorder": "Recorder",
    "premium.recorderDesc": "Record your shows as MP3 and rewind up to 5 minutes back",
    "premium.monthly": "One-time purchase — €9.99",
    "premium.buyLifetime": "Unlock forever",
    "premium.priceNote": "Indicative price. Final amount may vary by country.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Restore purchase",
    "premium.disclaimer": "One-time purchase, lifetime access. No subscription.",
    "premium.comingSoon": "Coming soon",
    "premium.passwordPlaceholder": "Enter access code",
    "premium.unlock": "Unlock",
    "premium.lock": "Lock Premium",
    "premium.wrongPassword": "Wrong code",
    "premium.unlocked": "Premium unlocked!",
    "sleepTimer.title": "Sleep Timer",
    "sleepTimer.desc": "Automatically stops playback after a set time",
    "sleepTimer.off": "Off",
    "sleepTimer.active": "Active",
    "sleepTimer.remaining": "Remaining",
    "sleepTimer.cancel": "Cancel timer",
    "sleepTimer.stopped": "Playback was automatically paused.",
    "sleepTimer.custom": "Custom",
    "sleepTimer.customPlaceholder": "Minutes",
    "sleepTimer.customGo": "Go",
    "sleepTimer.15": "15 min",
    "sleepTimer.30": "30 min",
    "sleepTimer.45": "45 min",
    "sleepTimer.60": "1 hour",
    "sleepTimer.90": "1h30",
    "sleepTimer.120": "2 hours",
    "player.nowPlaying": "Now playing",
    "player.streamError": "Playback error",
    "player.streamErrorDesc": "Unable to play this stream. Try another station.",
    "player.error": "Error",
    "player.streamUnavailable": "This station has no stream URL.",
    "player.visitWebsite": "Visit website",
    "player.timeout": "Timeout",
    "player.timeoutDesc": "The stream is not responding. Try another station.",
    "player.unexpectedError": "Unexpected error",
    "player.unexpectedErrorDesc": "An error occurred. Please try again.",
    "ssl.title": "Insecure connection",
    "ssl.description": "uses an unencrypted connection (HTTP). This issue comes from the radio server, not RadioSphere.be. Your data could be intercepted.",
    "ssl.technical": "This station's audio stream does not meet current SSL/TLS encryption standards. RadioSphere.be cannot guarantee the security of this connection.",
    "ssl.acceptRisk": "Listen at my own risk",
    "exit.title": "Close app?",
    "exit.description": "Press back one more time to exit RadioSphere.",
    "exit.confirm": "Exit",
    "common.cancel": "Cancel",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.languageDesc": "Choose the interface language",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Data usage",
    "settings.dataWarningDesc": "Listening to radio stations uses your internet connection and may consume mobile data. We recommend using Wi-Fi for extended listening.",
    "settings.dataDisclaimer": "Local data",
    "settings.dataDisclaimerDesc": "Your favorites and preferences are stored locally on your device. No personal data is sent to any server.",
    "settings.radioSource": "Station source",
    "settings.radioSourceDesc": "The station list is provided by Radio Browser, a free and open community API that indexes over 50,000 radio stations worldwide.",
    "settings.radioSourceLink": "Visit Radio Browser",
    "settings.radioSourceAddStation": "Add a station",
    "settings.analytics": "Audience Tracking",
    "settings.analyticsDesc": "RadioSphere.be uses Umami Analytics, a privacy-friendly and GDPR-compliant analytics solution.",
    "settings.analyticsNoCookies": "No tracking cookies",
    "settings.analyticsAnonymous": "Fully anonymized data",
    "settings.analyticsGDPR": "GDPR compliant",
    "settings.analyticsUsage": "Measures only global usage (page views, features used)",
    "settings.analyticsLearnMore": "Learn more about Umami",
    "favorites.manage": "Manage favorites",
    "favorites.export": "Export as CSV",
    "favorites.import": "Import CSV",
    "favorites.share": "Share my favorites",
    "favorites.exported": "Favorites exported",
    "favorites.imported": "favorites imported",
    "favorites.importError": "Import error",
    "favorites.refreshingMetadata": "Fetching metadata...",
    "favorites.metadataRefreshed": "Metadata updated",
    "favorites.unavailableStations": "Stations not found",
    "favorites.unavailableDesc": "These stations are no longer listed on Radio Browser and may no longer be available:",
    "favorites.understood": "Understood",
    "favorites.noFavoritesToExport": "No favorites to export",
    "favorites.refreshMetadata": "Refresh metadata",
    "settings.privacyPolicy": "Privacy Policy",
    "settings.reopenWelcome": "Reopen welcome page",
    "settings.resetApp": "Reset application",
    "settings.resetAppDesc": "Delete all favorites, recent stations, and preferences",
    "settings.resetConfirm": "Are you sure? This action cannot be undone.",
    "settings.resetDone": "Application reset",
    "settings.resetButton": "Delete everything",
    "premium.restorePurchases": "Restore purchases",
    "premium.restoreSuccess": "Purchases restored successfully",
    "premium.restoreNone": "No purchases to restore",
    "guide.title": "User Guide",
    "guide.button": "User Guide",
    "guide.home": "Home",
    "guide.homeContent": "The home screen shows your recently played stations, popular stations, quick access to favorites, weekly discoveries, and genre exploration.",
    "guide.search": "Search",
    "guide.searchContent": "Search for a station by name, then filter by country, genre, or language. Sort results by popularity, alphabetical order, or click count. Load more results at the bottom.",
    "guide.favorites": "Favorites",
    "guide.favoritesContent": "Tap the heart icon on a station to add it to your favorites. From settings, you can export your favorites as CSV, import them, or share them.",
    "guide.settings": "Settings",
    "guide.settingsContent": "Change the interface language, enable the sleep timer, manage your favorites (export/import/share), view station source information and the privacy policy.",
    "guide.permissions": "Permissions",
    "guide.permissionsContent": "RadioSphere.be requests a few permissions to work fully: notifications allow playback controls on your lock screen; location is needed to detect nearby Chromecast devices; storage access lets you save your recordings to your phone. No personal data is collected or sent. If you denied a permission by mistake, you can re-request it below or reload the welcome page.",
    "guide.permissionsContentDesktop": "On the web version, RadioSphere.be doesn't request any system permissions: audio playback works natively in your browser. No personal data is collected. To enjoy lock screen controls, built-in Chromecast and local recording, install the free Android app from Google Play.",
    "guide.permissionsContentMobile": "On your phone, RadioSphere.be (web) may ask permission to show notifications for playback controls. To go further (Chromecast, recordings stored on device, lock screen controls), install the free Android app from Google Play.",
    "guide.permissionsReRequest": "Re-request permissions",
    "guide.permissionsReopenWelcome": "Reload welcome page",
    "guide.sleepTimer": "Sleep Timer",
    "guide.sleepTimerContent": "Schedule automatic playback stop after a delay of your choice (15 min to 2 hours or custom duration). Perfect for falling asleep to the radio. Enable it from Settings.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Record your favorite shows as MP3 directly from the full-screen player. The 5-minute buffer also lets you rewind and relisten to what you just missed. Tap REC to start recording (10 min max). When the TBM icon blinks, it means the buffer is active and recording in the background. Tap the blinking icon to open the TimeBack player and relisten to the last few minutes.",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Stream your radio stations to your TV or connected speaker via Chromecast. Tap the Cast icon in the player to start casting.",
    "welcome.subtitle": "World radio at your fingertips",
    "welcome.chooseLanguage": "Choose language",
    "welcome.start": "Get started",
    "welcome.stations": "50,000+ stations",
    "welcome.search": "Advanced search",
    "welcome.favExport": "Favorites & export",
    "welcome.genres": "25 music genres",
    "welcome.sleepTimer": "Sleep timer",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Rewind live radio",
    "genre.60s": "60s",
    "genre.70s": "70s",
    "genre.80s": "80s",
    "genre.90s": "90s",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Classical",
    "genre.country": "Country",
    "genre.electronic": "Electronic",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latin",
    "genre.metal": "Metal",
    "genre.news": "News",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Casting to",
    "cast.controlFromPhone": "Control from your phone",
    "cast.connected": "Connected",
    "cast.disconnected": "Disconnected",
    "cast.unsupportedBrowser": "Chromecast is available in Google Chrome or the Android app.",
    "cast.openInChrome": "Open in Chrome to use Chromecast",
    "player.live": "LIVE",
    "player.recording": "Recording",
    "player.recordingStarted": "Recording started",
    "player.recordingStopped": "Recording finished",
    "player.recordingMaxReached": "Maximum duration reached (10 min)",
    "player.saveRecording": "Save to phone",
    "player.shareRecording": "Share recording",
    "player.returnToLive": "Back to live",
    "player.recordPremiumOnly": "Recording is a Premium feature",
    "player.fileSaved": "File saved!",
    "player.backInTime": "Back in Time",
    "player.bufferLoading": "Loading buffer...",
    "player.recordingNotAvailable": "Recording not available",
    "player.recordingContinuesLive": "Back to live, recording continues...",
    "player.codec": "Codec",
    "player.bitrate": "Bitrate",
    "player.language": "Language",
    "player.noStreamInfo": "No info provided by the stream or Radio Browser",
    "onboarding.title": "Welcome to RadioSphere.be",
    "onboarding.free": "100% Free",
    "onboarding.freeDesc": "Unlimited access, no subscription",
    "onboarding.noAds": "Zero Added Ads",
    "onboarding.noAdsDesc": "No ads added by RadioSphere.be. Stations may include their own ads in their streams.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Rewind live radio anytime",
    "onboarding.cta": "Coming soon on Google Play",
    "onboarding.dismiss": "Don't show again",
    "tbmQuota.title": "Want unlimited time travel?",
    "tbmQuota.description": "On the web, the TimeBack Machine is limited: rewind up to 2 minutes back and record up to 5 minutes max, with an overall 10 min/day quota on mobile to ensure stability. The premium version available on Google Play lets you rewind up to 5 minutes back and record up to 30 minutes, with no quota.",
    "tbmQuota.cta": "Download on Google Play",
    "tbmQuota.continueLive": "Continue live",
    "tbmQuota.warning": "Enjoy unlimited TimeBack Machine on our app!",
    "home.androidTitle": "RadioSphere.be on Android",
    "home.androidDesc": "Listen to your favorite stations anywhere, with Android Auto, Chromecast and the TimeBack Machine.",
    "home.comingSoon": "Coming soon",
    "notFound.message": "Oops! Page not found",
    "notFound.backHome": "Return to Home",
    "footer.poweredByPrefix": "Powered by the amazing ",
    "footer.poweredBySuffix": ". Special thanks to Alex Segler for this community-driven project.",
    "footer.createdBy": "Created by Franck Malherbe",
    "aria.play": "Play",
    "aria.pause": "Pause",
    "aria.addFavorite": "Add to favorites",
    "aria.removeFavorite": "Remove from favorites",
    "aria.close": "Close",
    "aria.refresh": "Refresh"
  },
  es: {
    "nav.home": "Inicio",
    "nav.search": "Buscar",
    "nav.explore": "Buscar y explorar",
    "nav.favorites": "Favoritos",
    "nav.premium": "Premium",
    "nav.settings": "Ajustes",
    "nav.about": "Acerca de",
    "sidebar.stationCount": "Más de 50 000 emisoras de radio en más de 230 países, gratis, sin registro, sin anuncios añadidos.",
    "sidebar.tbmTeaser": "Nuestra exclusiva: la TimeBack Machine — rebobina la radio en directo, vuelve a escuchar los últimos 5 minutos, graba tus programas en MP3. El reproductor de radio online que te permite retroceder en el tiempo.",
    "sidebar.tbmHowItWorks": "¿Cómo funciona?",
    "sidebar.podcastTeaser": "¿Te apetece un podcast?",
    "tbmModal.title": "TimeBack Machine — ¿Cómo funciona?",
    "tbmModal.intro": "La TimeBack Machine es una exclusiva de RadioSphere.be que revoluciona la escucha de radio online. ¡No te pierdas ningún momento importante en directo!",
    "tbmModal.bufferTitle": "🔄 Búfer inteligente (5 minutos)",
    "tbmModal.bufferDesc": "En cuanto escuchas una emisora, RadioSphere.be graba automáticamente los últimos 5 minutos en un búfer circular. No necesitas activar nada: es automático y transparente.",
    "tbmModal.rewindTitle": "⏪ Rebobinar el directo",
    "tbmModal.rewindDesc": "¿Te perdiste una noticia, una canción o un momento clave? Abre la TimeBack Machine y rebobina hasta 5 minutos. Usa los botones -15s/+15s o desliza la línea de tiempo para navegar con precisión.",
    "tbmModal.recordTitle": "🔴 Grabar en MP3",
    "tbmModal.recordDesc": "Pulsa REC para capturar hasta 10 minutos de emisión en MP3, directamente desde el reproductor. Perfecto para guardar entrevistas, canciones o programas enteros.",
    "tbmModal.iconTitle": "💡 El icono TBM parpadeante",
    "tbmModal.iconDesc": "Cuando el icono TBM parpadea en el reproductor, significa que el búfer está activo y grabando continuamente. Tócalo para abrir la TimeBack Machine y acceder a tus últimos minutos de escucha.",
    "tbmModal.liveTitle": "📡 Volver al directo",
    "tbmModal.liveDesc": "En cualquier momento, pulsa 'EN DIRECTO' para volver instantáneamente al flujo en vivo de tu emisora.",
    "tbmModal.close": "Entendido",
    "app.downloadTitle": "Aplicación Móvil",
    "app.downloadDesc": "Escucha tus radios en cualquier lugar con la app Android.",
    "app.downloadBtn": "Próximamente",
    "footer.tagline": "El reproductor web premium para escuchar miles de estaciones de radio de todo el mundo.",
    "footer.links": "Enlaces útiles",
    "footer.contact": "Contacto",
    "footer.rights": "Todos los derechos reservados.",
    "privacy.title": "Política de privacidad",
    "privacy.lastUpdated": "Última actualización",
    "privacy.dataCollection": "Recopilación de datos",
    "privacy.dataCollectionDesc": "RadioSphere.be no recopila ningún dato personal identificable. No se requiere registro para usar el servicio.",
    "privacy.localStorage": "Almacenamiento local",
    "privacy.localStorageDesc": "Todos los datos se almacenan exclusivamente en su dispositivo:",
    "privacy.localStorageFavorites": "Sus estaciones favoritas",
    "privacy.localStorageLang": "Su preferencia de idioma",
    "privacy.localStorageRecent": "Sus estaciones recientes",
    "privacy.localStoragePrefs": "Sus ajustes de interfaz",
    "privacy.analytics": "Medición de audiencia (Umami Analytics)",
    "privacy.analyticsDesc": "Utilizamos Umami Analytics, una solución de medición de audiencia respetuosa con la privacidad y conforme al RGPD. Umami no recopila datos personales identificables, no utiliza cookies y todos los datos están anonimizados. Solo medimos estadísticas de uso global (páginas visitadas, funciones utilizadas) para mejorar el servicio.",
    "privacy.analyticsNoCookies": "Sin cookies de seguimiento",
    "privacy.analyticsAnonymous": "Datos completamente anonimizados",
    "privacy.analyticsGDPR": "Conforme al RGPD",
    "privacy.analyticsNoPersonal": "No se recopilan datos personales identificables",
    "privacy.analyticsLearnMore": "Más información sobre la política de privacidad de Umami",
    "privacy.thirdParty": "Servicios de terceros",
    "privacy.thirdPartyDesc": "Los flujos de audio son proporcionados directamente por las estaciones de radio a través de la API Radio Browser. Los flujos pueden contener publicidad insertada por las propias estaciones — RadioSphere.be no puede filtrarla ni bloquearla.",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) se utiliza para medir el tráfico del sitio de forma anónima. No se utilizan cookies, no se recopilan datos personales. Solo se generan estadísticas agregadas y anónimas.",
    "privacy.permissions": "Navegador web",
    "privacy.permissionsDesc": "RadioSphere.be es un sitio web accesible desde cualquier navegador moderno. No se requiere instalación. El sitio no utiliza cookies de terceros. Solo se utiliza el almacenamiento local (localStorage) de su navegador para recordar sus preferencias.",
    "privacy.security": "Seguridad",
    "privacy.securityDesc": "No se recopilan ni transmiten datos personales. Sus favoritos y preferencias nunca salen de su dispositivo.",
    "privacy.contact": "Contacto",
    "privacy.contactDesc": "Para cualquier pregunta sobre esta política de privacidad, puede contactarnos en:",
    "player.selectStation": "Seleccione una estación para empezar",
    "home.greeting": "Hola 👋",
    "home.recentlyPlayed": "Escuchadas recientemente",
    "home.popularStations": "Estaciones populares",
    "home.localPopular": "Estaciones populares",
    "home.exploreByGenre": "Explorar por género",
    "home.yourFavorites": "Tus favoritos",
    "home.weeklyDiscoveries": "Descubrimientos de la semana",
    "home.popularNearYou": "Populares cerca de ti",
    "home.noFavorites": "Añade favoritos para verlos aquí",
    "search.title": "Buscar",
    "search.placeholder": "Buscar una estación...",
    "search.country": "País",
    "search.selectCountry": "Seleccionar un país",
    "search.clearCountry": "Borrar país",
    "search.resetFilters": "Restablecer filtros",
    "search.notFoundTitle": "¿No encuentras tu emisora favorita?",
    "search.notFoundAddOn": "Puedes añadirla directamente en",
    "search.notFoundEmailUs": "También podemos intentar añadirla por ti: envíanos un correo a",
    "inAppBrowser.warning": "Para una mejor experiencia, abre RadioSphere.be en tu navegador habitual.",
    "inAppBrowser.openExternal": "Abrir en el navegador",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Sin resultados",
    "search.networkError": "Error de red. No se pudo conectar con el servidor de estaciones.",
    "search.countriesError": "No se pudo cargar la lista de países.",
    "search.retry": "Reintentar",
    "search.useFilters": "Usa la búsqueda o los filtros para encontrar estaciones",
    "search.genre": "Género",
    "search.language": "Idioma",
    "search.loadMore": "Más estaciones",
    "search.loadingMore": "Cargando...",
    "search.sortPopularity": "Popularidad",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Clics",
    "search.resultsCount": "estaciones encontradas",
    "favorites.title": "Favoritos",
    "favorites.empty": "Sin favoritos",
    "favorites.emptyDesc": "Pulsa el corazón de una estación para añadirla a tus favoritos",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Por país",
    "favorites.unknownCountry": "País desconocido",
    "favorites.sortGenre": "Por género",
    "favorites.unknownGenre": "Género desconocido",
    "favorites.viewList": "Lista",
    "favorites.viewMedium": "Miniaturas",
    "favorites.viewLarge": "Miniaturas grandes",
    "favorites.viewSmall": "Miniaturas pequeñas",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "La experiencia de radio definitiva",
    "premium.active": "Premium activo",
    "premium.sleepTimer": "Temporizador de sueño",
    "premium.sleepTimerDesc": "Detiene automáticamente la reproducción tras un tiempo configurable",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Controla RadioSphere.be directamente desde Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Transmite tus estaciones a tu TV o altavoz conectado vía Chromecast",
    "premium.recorder": "Grabadora",
    "premium.recorderDesc": "Graba tus programas en MP3 y rebobina hasta 5 minutos atrás",
    "premium.monthly": "Compra única — 9,99€",
    "premium.buyLifetime": "Desbloquear para siempre",
    "premium.priceNote": "Precio indicativo. El monto final puede variar según el país.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Restaurar compra",
    "premium.disclaimer": "Compra única, acceso de por vida. Sin suscripción.",
    "premium.comingSoon": "Próximamente",
    "premium.passwordPlaceholder": "Introduce el código de acceso",
    "premium.unlock": "Desbloquear",
    "premium.lock": "Bloquear Premium",
    "premium.wrongPassword": "Código incorrecto",
    "premium.unlocked": "¡Premium desbloqueado!",
    "sleepTimer.title": "Temporizador de sueño",
    "sleepTimer.desc": "Detiene automáticamente la reproducción tras un tiempo",
    "sleepTimer.off": "Desactivado",
    "sleepTimer.active": "Activo",
    "sleepTimer.remaining": "Restante",
    "sleepTimer.cancel": "Cancelar temporizador",
    "sleepTimer.stopped": "La reproducción se pausó automáticamente.",
    "sleepTimer.custom": "Personalizado",
    "sleepTimer.customPlaceholder": "Minutos",
    "sleepTimer.customGo": "Ir",
    "sleepTimer.15": "15 min",
    "sleepTimer.30": "30 min",
    "sleepTimer.45": "45 min",
    "sleepTimer.60": "1 hora",
    "sleepTimer.90": "1h30",
    "sleepTimer.120": "2 horas",
    "player.nowPlaying": "Reproduciendo",
    "player.streamError": "Error de reproducción",
    "player.streamErrorDesc": "No se pudo reproducir este flujo. Prueba otra estación.",
    "player.error": "Error",
    "player.streamUnavailable": "Esta estación no tiene URL de flujo.",
    "player.visitWebsite": "Visitar sitio web",
    "player.timeout": "Tiempo agotado",
    "player.timeoutDesc": "El flujo no responde. Prueba otra estación.",
    "player.unexpectedError": "Error inesperado",
    "player.unexpectedErrorDesc": "Ocurrió un error. Inténtalo de nuevo.",
    "ssl.title": "Conexión no segura",
    "ssl.description": "usa una conexión sin cifrar (HTTP). Este problema proviene del servidor de la radio, no de RadioSphere.be. Tus datos podrían ser interceptados.",
    "ssl.technical": "El flujo de audio de esta estación no cumple con los estándares actuales de cifrado SSL/TLS. RadioSphere.be no puede garantizar la seguridad de esta conexión.",
    "ssl.acceptRisk": "Escuchar bajo mi responsabilidad",
    "exit.title": "¿Cerrar la aplicación?",
    "exit.description": "Pulsa atrás una vez más para salir de RadioSphere.",
    "exit.confirm": "Salir",
    "common.cancel": "Cancelar",
    "settings.title": "Ajustes",
    "settings.language": "Idioma",
    "settings.languageDesc": "Elige el idioma de la interfaz",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Uso de datos",
    "settings.dataWarningDesc": "Escuchar estaciones de radio utiliza tu conexión a internet y puede consumir datos móviles. Recomendamos usar Wi-Fi para una escucha prolongada.",
    "settings.dataDisclaimer": "Datos locales",
    "settings.dataDisclaimerDesc": "Tus favoritos y preferencias se almacenan localmente en tu dispositivo. No se envían datos personales a ningún servidor.",
    "settings.radioSource": "Fuente de estaciones",
    "settings.radioSourceDesc": "La lista de estaciones es proporcionada por Radio Browser, una API comunitaria libre y gratuita que indexa más de 50 000 estaciones de radio en todo el mundo.",
    "settings.radioSourceLink": "Visitar Radio Browser",
    "settings.radioSourceAddStation": "Añadir una estación",
    "settings.analytics": "Medición de audiencia",
    "settings.analyticsDesc": "RadioSphere.be utiliza Umami Analytics, una solución de medición de audiencia respetuosa con la privacidad y conforme al RGPD.",
    "settings.analyticsNoCookies": "Sin cookies de seguimiento",
    "settings.analyticsAnonymous": "Datos completamente anonimizados",
    "settings.analyticsGDPR": "Conforme al RGPD",
    "settings.analyticsUsage": "Mide solo el uso global (páginas vistas, funciones utilizadas)",
    "settings.analyticsLearnMore": "Más información sobre Umami",
    "favorites.manage": "Gestionar favoritos",
    "favorites.export": "Exportar como CSV",
    "favorites.import": "Importar CSV",
    "favorites.share": "Compartir mis favoritos",
    "favorites.exported": "Favoritos exportados",
    "favorites.imported": "favoritos importados",
    "favorites.importError": "Error de importación",
    "favorites.refreshingMetadata": "Recuperando metadatos...",
    "favorites.metadataRefreshed": "Metadatos actualizados",
    "favorites.unavailableStations": "Estaciones no encontradas",
    "favorites.unavailableDesc": "Estas estaciones ya no están listadas en Radio Browser y podrían no estar disponibles:",
    "favorites.understood": "Entendido",
    "favorites.noFavoritesToExport": "No hay favoritos para exportar",
    "favorites.refreshMetadata": "Actualizar metadatos",
    "settings.privacyPolicy": "Política de privacidad",
    "settings.reopenWelcome": "Reabrir página de bienvenida",
    "settings.resetApp": "Restablecer aplicación",
    "settings.resetAppDesc": "Eliminar todos los favoritos, estaciones recientes y preferencias",
    "settings.resetConfirm": "¿Estás seguro? Esta acción no se puede deshacer.",
    "settings.resetDone": "Aplicación restablecida",
    "settings.resetButton": "Eliminar todo",
    "premium.restorePurchases": "Restaurar compras",
    "premium.restoreSuccess": "Compras restauradas con éxito",
    "premium.restoreNone": "No hay compras para restaurar",
    "guide.title": "Guía de uso",
    "guide.button": "Guía de uso",
    "guide.home": "Inicio",
    "guide.homeContent": "La pantalla de inicio muestra tus estaciones escuchadas recientemente, estaciones populares, acceso rápido a favoritos, descubrimientos semanales y exploración por género.",
    "guide.search": "Buscar",
    "guide.searchContent": "Busca una estación por nombre, luego filtra por país, género o idioma. Ordena los resultados por popularidad, orden alfabético o número de clics. Carga más resultados al final.",
    "guide.favorites": "Favoritos",
    "guide.favoritesContent": "Pulsa el icono de corazón en una estación para añadirla a tus favoritos. Desde los ajustes, puedes exportar tus favoritos como CSV, importarlos o compartirlos.",
    "guide.settings": "Ajustes",
    "guide.settingsContent": "Cambia el idioma de la interfaz, activa el temporizador de sueño, gestiona tus favoritos (exportar/importar/compartir), consulta la fuente de estaciones y la política de privacidad.",
    "guide.permissions": "Permisos",
    "guide.permissionsContent": "RadioSphere.be solicita algunos permisos para funcionar completamente: las notificaciones permiten mostrar los controles de reproducción en la pantalla de bloqueo; la ubicación es necesaria para detectar dispositivos Chromecast cercanos; el acceso al almacenamiento permite guardar tus grabaciones en el teléfono. No se recopilan ni envían datos personales. Si rechazaste un permiso por error, puedes volver a solicitarlo a continuación o recargar la página de bienvenida.",
    "guide.permissionsContentDesktop": "En la versión web, RadioSphere.be no solicita ningún permiso del sistema: la reproducción de audio funciona de forma nativa en tu navegador. No se recopilan datos personales. Para disfrutar de los controles en pantalla de bloqueo, Chromecast integrado y grabación local, instala la app Android gratuita desde Google Play.",
    "guide.permissionsContentMobile": "En tu teléfono, RadioSphere.be (web) puede pedir permiso para mostrar notificaciones de los controles de reproducción. Para más funciones (Chromecast, grabaciones guardadas en el dispositivo, controles de pantalla de bloqueo), instala la app Android gratuita desde Google Play.",
    "guide.permissionsReRequest": "Volver a solicitar permisos",
    "guide.permissionsReopenWelcome": "Recargar página de bienvenida",
    "guide.sleepTimer": "Temporizador de sueño",
    "guide.sleepTimerContent": "Programa la parada automática de la reproducción tras un tiempo a tu elección (15 min a 2 horas o duración personalizada). Ideal para dormirse con la radio. Actívalo desde los Ajustes.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Graba tus programas favoritos en MP3 directamente desde el reproductor a pantalla completa. El búfer de 5 minutos también te permite rebobinar y volver a escuchar lo que acabas de perder. Pulsa REC para iniciar la grabación (10 min máx). Cuando el icono TBM parpadea, significa que el búfer está activo y grabando en segundo plano. Toca el icono parpadeante para abrir el reproductor TimeBack y volver a escuchar los últimos minutos.",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Transmite tus estaciones de radio a tu televisor o altavoz conectado a través de Chromecast. Pulsa el icono Cast en el reproductor para empezar la transmisión.",
    "welcome.subtitle": "La radio mundial al alcance de tu mano",
    "welcome.chooseLanguage": "Elige el idioma",
    "welcome.start": "Comenzar",
    "welcome.stations": "50 000+ estaciones",
    "welcome.search": "Búsqueda avanzada",
    "welcome.favExport": "Favoritos y exportación",
    "welcome.genres": "25 géneros musicales",
    "welcome.sleepTimer": "Temporizador de sueño",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Rebobina el directo",
    "genre.60s": "60s",
    "genre.70s": "70s",
    "genre.80s": "80s",
    "genre.90s": "90s",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Clásica",
    "genre.country": "Country",
    "genre.electronic": "Electrónica",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latina",
    "genre.metal": "Metal",
    "genre.news": "Noticias",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Transmitiendo en",
    "cast.controlFromPhone": "Controla desde tu teléfono",
    "cast.connected": "Conectado",
    "cast.disconnected": "Desconectado",
    "cast.unsupportedBrowser": "Chromecast está disponible en Google Chrome o la aplicación Android.",
    "cast.openInChrome": "Abre en Chrome para usar Chromecast",
    "player.live": "EN VIVO",
    "player.recording": "Grabando",
    "player.recordingStarted": "Grabación iniciada",
    "player.recordingStopped": "Grabación finalizada",
    "player.recordingMaxReached": "Duración máxima alcanzada (10 min)",
    "player.saveRecording": "Guardar en el teléfono",
    "player.shareRecording": "Compartir grabación",
    "player.returnToLive": "Volver al directo",
    "player.recordPremiumOnly": "La grabación es una función Premium",
    "player.fileSaved": "¡Archivo guardado!",
    "player.backInTime": "Volver al pasado",
    "player.bufferLoading": "Cargando búfer...",
    "player.recordingNotAvailable": "Grabación no disponible",
    "player.recordingContinuesLive": "Volviendo al directo, grabación en curso...",
    "player.codec": "Códec",
    "player.bitrate": "Bitrate",
    "player.language": "Idioma",
    "player.noStreamInfo": "Sin información del stream o Radio Browser",
    "onboarding.title": "Bienvenido a RadioSphere.be",
    "onboarding.free": "100% Gratis",
    "onboarding.freeDesc": "Acceso ilimitado sin suscripción",
    "onboarding.noAds": "Sin Publicidad Añadida",
    "onboarding.noAdsDesc": "RadioSphere.be no añade publicidad. Las estaciones pueden incluir sus propios anuncios en su flujo.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Rebobina la radio en directo",
    "onboarding.cta": "Próximamente en Google Play",
    "onboarding.dismiss": "No mostrar más",
    "tbmQuota.title": "¿Quieres retroceder en el tiempo sin límites?",
    "tbmQuota.description": "En la web, la TimeBack Machine es limitada: rebobinado hasta 2 minutos atrás y grabación hasta 5 minutos máximo, con un cupo global de 10 min/día en móvil para garantizar la estabilidad. La versión premium disponible en Google Play permite rebobinar hasta 5 minutos atrás y grabar hasta 30 minutos, sin cupo.",
    "tbmQuota.cta": "Descargar en Google Play",
    "tbmQuota.continueLive": "Continuar en directo",
    "tbmQuota.warning": "¡Disfruta de la TimeBack Machine sin límites en nuestra aplicación!",
    "home.androidTitle": "RadioSphere.be en Android",
    "home.androidDesc": "Escucha tus emisoras favoritas en cualquier lugar, con Android Auto, Chromecast y la TimeBack Machine.",
    "home.comingSoon": "Próximamente",
    "notFound.message": "¡Ups! Página no encontrada",
    "notFound.backHome": "Volver al inicio",
    "footer.poweredByPrefix": "Impulsado por el increíble ",
    "footer.poweredBySuffix": ". Gracias a Alex Segler por este proyecto comunitario.",
    "footer.createdBy": "Creado por Franck Malherbe",
    "aria.play": "Reproducir",
    "aria.pause": "Pausar",
    "aria.addFavorite": "Añadir a favoritos",
    "aria.removeFavorite": "Quitar de favoritos",
    "aria.close": "Cerrar",
    "aria.refresh": "Actualizar"
  },
  de: {
    "nav.home": "Startseite",
    "nav.search": "Suche",
    "nav.explore": "Suchen & Entdecken",
    "nav.favorites": "Favoriten",
    "nav.premium": "Premium",
    "nav.settings": "Einstellungen",
    "nav.about": "Über uns",
    "sidebar.stationCount": "Über 50.000 Radiosender aus mehr als 230 Ländern, kostenlos, ohne Registrierung, ohne zusätzliche Werbung.",
    "sidebar.tbmTeaser": "Unser Exklusiv-Feature: die TimeBack Machine — spule Live-Radio zurück, höre die letzten 5 Minuten erneut, nimm Sendungen als MP3 auf. Der Online-Radioplayer, mit dem du die Zeit zurückdrehen kannst.",
    "sidebar.tbmHowItWorks": "Wie funktioniert es?",
    "sidebar.podcastTeaser": "Lust auf einen Podcast?",
    "tbmModal.title": "TimeBack Machine — Wie funktioniert es?",
    "tbmModal.intro": "Die TimeBack Machine ist ein exklusives Feature von RadioSphere.be, das das Online-Radiohören revolutioniert. Verpasse nie wieder einen wichtigen Live-Moment!",
    "tbmModal.bufferTitle": "🔄 Intelligenter Puffer (5 Minuten)",
    "tbmModal.bufferDesc": "Sobald du einen Sender hörst, zeichnet RadioSphere.be automatisch die letzten 5 Minuten in einem Ringpuffer auf. Du musst nichts aktivieren: es ist automatisch und transparent.",
    "tbmModal.rewindTitle": "⏪ Live-Radio zurückspulen",
    "tbmModal.rewindDesc": "Hast du eine Nachricht, einen Song oder einen wichtigen Moment verpasst? Öffne die TimeBack Machine und spule bis zu 5 Minuten zurück. Nutze die -15s/+15s-Buttons oder ziehe die Timeline für präzise Navigation.",
    "tbmModal.recordTitle": "🔴 Als MP3 aufnehmen",
    "tbmModal.recordDesc": "Tippe auf REC, um bis zu 10 Minuten Sendung als MP3 aufzunehmen, direkt vom Player. Perfekt zum Speichern von Interviews, Tracks oder ganzen Sendungen.",
    "tbmModal.iconTitle": "💡 Das blinkende TBM-Symbol",
    "tbmModal.iconDesc": "Wenn das TBM-Symbol im Player blinkt, bedeutet das, dass der Puffer aktiv ist und kontinuierlich aufnimmt. Tippe darauf, um die TimeBack Machine zu öffnen und auf deine letzten Minuten zuzugreifen.",
    "tbmModal.liveTitle": "📡 Zurück zum Live-Stream",
    "tbmModal.liveDesc": "Tippe jederzeit auf 'LIVE', um sofort zum Live-Stream deines Senders zurückzukehren.",
    "tbmModal.close": "Verstanden",
    "app.downloadTitle": "Mobile App",
    "app.downloadDesc": "Hören Sie Ihre Radios überall mit der Android-App.",
    "app.downloadBtn": "Demnächst verfügbar",
    "footer.tagline": "Der Premium-Webplayer für Tausende Radiosender weltweit.",
    "footer.links": "Nützliche Links",
    "footer.contact": "Kontakt",
    "footer.rights": "Alle Rechte vorbehalten.",
    "privacy.title": "Datenschutzrichtlinie",
    "privacy.lastUpdated": "Letzte Aktualisierung",
    "privacy.dataCollection": "Datenerfassung",
    "privacy.dataCollectionDesc": "RadioSphere.be erhebt keine personenbezogenen Daten. Für die Nutzung ist keine Registrierung erforderlich.",
    "privacy.localStorage": "Lokaler Speicher",
    "privacy.localStorageDesc": "Alle Daten werden ausschließlich auf Ihrem Gerät gespeichert:",
    "privacy.localStorageFavorites": "Ihre Lieblingssender",
    "privacy.localStorageLang": "Ihre Spracheinstellung",
    "privacy.localStorageRecent": "Ihre zuletzt gehörten Sender",
    "privacy.localStoragePrefs": "Ihre Schnittstelleneinstellungen",
    "privacy.analytics": "Publikumsmessung (Umami Analytics)",
    "privacy.analyticsDesc": "Wir verwenden Umami Analytics, eine datenschutzfreundliche und DSGVO-konforme Analyselösung. Umami sammelt keine personenbezogenen Daten, verwendet keine Cookies und alle Daten sind anonymisiert. Wir erfassen nur globale Nutzungsstatistiken (besuchte Seiten, verwendete Funktionen) zur Verbesserung des Dienstes.",
    "privacy.analyticsNoCookies": "Keine Tracking-Cookies",
    "privacy.analyticsAnonymous": "Vollständig anonymisierte Daten",
    "privacy.analyticsGDPR": "DSGVO-konform",
    "privacy.analyticsNoPersonal": "Keine personenbezogenen Daten erfasst",
    "privacy.analyticsLearnMore": "Mehr über Umamis Datenschutzrichtlinie erfahren",
    "privacy.thirdParty": "Drittanbieter-Dienste",
    "privacy.thirdPartyDesc": "Audio-Streams werden direkt von den Radiosendern über die Radio Browser API bereitgestellt. Die Streams können Werbung enthalten, die direkt von den Sendern eingefügt wird — RadioSphere.be kann diese nicht filtern oder blockieren.",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) wird verwendet, um den Website-Traffic anonym zu messen. Es werden keine Cookies verwendet, keine personenbezogenen Daten gesammelt. Es werden nur aggregierte und anonyme Statistiken generiert.",
    "privacy.permissions": "Webbrowser",
    "privacy.permissionsDesc": "RadioSphere.be ist eine Website, die über jeden modernen Browser zugänglich ist. Keine Installation erforderlich. Die Website verwendet keine Drittanbieter-Cookies. Nur der lokale Speicher (localStorage) Ihres Browsers wird verwendet, um Ihre Einstellungen zu speichern.",
    "privacy.security": "Sicherheit",
    "privacy.securityDesc": "Da keine persönlichen Daten erfasst oder übertragen werden, besteht kein Risiko von Datenlecks.",
    "privacy.contact": "Kontakt",
    "privacy.contactDesc": "Bei Fragen zu dieser Datenschutzrichtlinie kontaktieren Sie uns unter:",
    "player.selectStation": "Wählen Sie einen Sender zum Anhören",
    "home.greeting": "Hallo 👋",
    "home.recentlyPlayed": "Zuletzt gehört",
    "home.popularStations": "Beliebte Sender",
    "home.localPopular": "Beliebte Sender",
    "home.exploreByGenre": "Nach Genre entdecken",
    "home.yourFavorites": "Deine Favoriten",
    "home.weeklyDiscoveries": "Entdeckungen der Woche",
    "home.popularNearYou": "Beliebt in deiner Nähe",
    "home.noFavorites": "Füge Favoriten hinzu, um sie hier zu sehen",
    "search.title": "Suche",
    "search.placeholder": "Sender suchen...",
    "search.country": "Land",
    "search.selectCountry": "Land auswählen",
    "search.clearCountry": "Land löschen",
    "search.resetFilters": "Filter zurücksetzen",
    "search.notFoundTitle": "Sie finden Ihren Lieblingssender nicht?",
    "search.notFoundAddOn": "Sie können ihn direkt hinzufügen auf",
    "search.notFoundEmailUs": "Wir können auch versuchen, ihn für Sie hinzuzufügen: schreiben Sie uns an",
    "inAppBrowser.warning": "Für ein besseres Erlebnis öffne RadioSphere.be in deinem normalen Browser.",
    "inAppBrowser.openExternal": "Im Browser öffnen",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Keine Ergebnisse",
    "search.networkError": "Netzwerkfehler. Der Sender-Server konnte nicht erreicht werden.",
    "search.countriesError": "Die Länderliste konnte nicht geladen werden.",
    "search.retry": "Erneut versuchen",
    "search.useFilters": "Verwende die Suche oder Filter, um Sender zu finden",
    "search.genre": "Genre",
    "search.language": "Sprache",
    "search.loadMore": "Mehr Sender",
    "search.loadingMore": "Laden...",
    "search.sortPopularity": "Beliebtheit",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Klicks",
    "search.resultsCount": "Sender gefunden",
    "favorites.title": "Favoriten",
    "favorites.empty": "Keine Favoriten",
    "favorites.emptyDesc": "Tippe auf das Herz eines Senders, um ihn zu deinen Favoriten hinzuzufügen",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Nach Land",
    "favorites.unknownCountry": "Unbekanntes Land",
    "favorites.sortGenre": "Nach Genre",
    "favorites.unknownGenre": "Unbekanntes Genre",
    "favorites.viewList": "Liste",
    "favorites.viewMedium": "Kacheln",
    "favorites.viewLarge": "Große Kacheln",
    "favorites.viewSmall": "Kleine Kacheln",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "Das ultimative Radio-Erlebnis",
    "premium.active": "Premium aktiv",
    "premium.sleepTimer": "Schlaf-Timer",
    "premium.sleepTimerDesc": "Stoppt die Wiedergabe automatisch nach einer konfigurierbaren Zeit",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Steuere RadioSphere.be direkt über Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Streame deine Sender auf deinen Fernseher oder Lautsprecher über Chromecast",
    "premium.recorder": "Rekorder",
    "premium.recorderDesc": "Nimm deine Sendungen als MP3 auf und spule bis zu 5 Minuten zurück",
    "premium.monthly": "Einmalkauf — 9,99€",
    "premium.buyLifetime": "Für immer freischalten",
    "premium.priceNote": "Richtpreis. Der Endbetrag kann je nach Land variieren.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Kauf wiederherstellen",
    "premium.disclaimer": "Einmalkauf, lebenslanger Zugang. Kein Abo.",
    "premium.comingSoon": "Demnächst",
    "premium.passwordPlaceholder": "Zugangscode eingeben",
    "premium.unlock": "Freischalten",
    "premium.lock": "Premium sperren",
    "premium.wrongPassword": "Falscher Code",
    "premium.unlocked": "Premium freigeschaltet!",
    "sleepTimer.title": "Schlaf-Timer",
    "sleepTimer.desc": "Stoppt die Wiedergabe automatisch nach einer bestimmten Zeit",
    "sleepTimer.off": "Aus",
    "sleepTimer.active": "Aktiv",
    "sleepTimer.remaining": "Verbleibend",
    "sleepTimer.cancel": "Timer abbrechen",
    "sleepTimer.stopped": "Die Wiedergabe wurde automatisch pausiert.",
    "sleepTimer.custom": "Benutzerdefiniert",
    "sleepTimer.customPlaceholder": "Minuten",
    "sleepTimer.customGo": "Los",
    "sleepTimer.15": "15 Min",
    "sleepTimer.30": "30 Min",
    "sleepTimer.45": "45 Min",
    "sleepTimer.60": "1 Stunde",
    "sleepTimer.90": "1h30",
    "sleepTimer.120": "2 Stunden",
    "player.nowPlaying": "Wird abgespielt",
    "player.streamError": "Wiedergabefehler",
    "player.streamErrorDesc": "Dieser Stream konnte nicht abgespielt werden. Versuche einen anderen Sender.",
    "player.error": "Fehler",
    "player.streamUnavailable": "Dieser Sender hat keine Stream-URL.",
    "player.visitWebsite": "Website besuchen",
    "player.timeout": "Zeitüberschreitung",
    "player.timeoutDesc": "Der Stream antwortet nicht. Versuche einen anderen Sender.",
    "player.unexpectedError": "Unerwarteter Fehler",
    "player.unexpectedErrorDesc": "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    "ssl.title": "Unsichere Verbindung",
    "ssl.description": "verwendet eine unverschlüsselte Verbindung (HTTP). Dieses Problem liegt am Server des Radiosenders, nicht an RadioSphere.be. Ihre Daten könnten abgefangen werden.",
    "ssl.technical": "Der Audiostream dieses Senders entspricht nicht den aktuellen SSL/TLS-Verschlüsselungsstandards. RadioSphere.be kann die Sicherheit dieser Verbindung nicht garantieren.",
    "ssl.acceptRisk": "Auf eigenes Risiko hören",
    "exit.title": "App schließen?",
    "exit.description": "Drücke noch einmal zurück, um RadioSphere zu beenden.",
    "exit.confirm": "Beenden",
    "common.cancel": "Abbrechen",
    "settings.title": "Einstellungen",
    "settings.language": "Sprache",
    "settings.languageDesc": "Wähle die Sprache der Benutzeroberfläche",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Datenverbrauch",
    "settings.dataWarningDesc": "Das Hören von Radiosendern nutzt deine Internetverbindung und kann mobile Daten verbrauchen. Wir empfehlen WLAN für längeres Hören.",
    "settings.dataDisclaimer": "Lokale Daten",
    "settings.dataDisclaimerDesc": "Deine Favoriten und Einstellungen werden lokal auf deinem Gerät gespeichert. Es werden keine persönlichen Daten an einen Server gesendet.",
    "settings.radioSource": "Senderquelle",
    "settings.radioSourceDesc": "Die Senderliste wird von Radio Browser bereitgestellt, einer freien und kostenlosen Community-API mit über 50 000 Radiosendern weltweit.",
    "settings.radioSourceLink": "Radio Browser besuchen",
    "settings.radioSourceAddStation": "Sender hinzufügen",
    "settings.analytics": "Publikumsmessung",
    "settings.analyticsDesc": "RadioSphere.be verwendet Umami Analytics, eine datenschutzfreundliche und DSGVO-konforme Analyselösung.",
    "settings.analyticsNoCookies": "Keine Tracking-Cookies",
    "settings.analyticsAnonymous": "Vollständig anonymisierte Daten",
    "settings.analyticsGDPR": "DSGVO-konform",
    "settings.analyticsUsage": "Misst nur die globale Nutzung (Seitenaufrufe, verwendete Funktionen)",
    "settings.analyticsLearnMore": "Mehr über Umami erfahren",
    "favorites.manage": "Favoriten verwalten",
    "favorites.export": "Als CSV exportieren",
    "favorites.import": "CSV importieren",
    "favorites.share": "Meine Favoriten teilen",
    "favorites.exported": "Favoriten exportiert",
    "favorites.imported": "Favoriten importiert",
    "favorites.importError": "Importfehler",
    "favorites.refreshingMetadata": "Metadaten werden abgerufen...",
    "favorites.metadataRefreshed": "Metadaten aktualisiert",
    "favorites.unavailableStations": "Sender nicht gefunden",
    "favorites.unavailableDesc": "Diese Sender sind nicht mehr bei Radio Browser gelistet und sind möglicherweise nicht mehr verfügbar:",
    "favorites.understood": "Verstanden",
    "favorites.noFavoritesToExport": "Keine Favoriten zum Exportieren",
    "favorites.refreshMetadata": "Metadaten aktualisieren",
    "settings.privacyPolicy": "Datenschutzrichtlinie",
    "settings.reopenWelcome": "Willkommensseite erneut öffnen",
    "settings.resetApp": "App zurücksetzen",
    "settings.resetAppDesc": "Alle Favoriten, zuletzt gehörte Sender und Einstellungen löschen",
    "settings.resetConfirm": "Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.",
    "settings.resetDone": "App zurückgesetzt",
    "settings.resetButton": "Alles löschen",
    "premium.restorePurchases": "Käufe wiederherstellen",
    "premium.restoreSuccess": "Käufe erfolgreich wiederhergestellt",
    "premium.restoreNone": "Keine Käufe zum Wiederherstellen",
    "guide.title": "Benutzerhandbuch",
    "guide.button": "Benutzerhandbuch",
    "guide.home": "Startseite",
    "guide.homeContent": "Der Startbildschirm zeigt deine zuletzt gehörten Sender, beliebte Sender, Schnellzugriff auf Favoriten, wöchentliche Entdeckungen und Genre-Erkundung.",
    "guide.search": "Suche",
    "guide.searchContent": "Suche einen Sender nach Name, dann filtere nach Land, Genre oder Sprache. Sortiere Ergebnisse nach Beliebtheit, alphabetisch oder nach Klickanzahl. Lade weitere Ergebnisse am Ende.",
    "guide.favorites": "Favoriten",
    "guide.favoritesContent": "Tippe auf das Herz-Symbol eines Senders, um ihn zu deinen Favoriten hinzuzufügen. In den Einstellungen kannst du deine Favoriten als CSV exportieren, importieren oder teilen.",
    "guide.settings": "Einstellungen",
    "guide.settingsContent": "Ändere die Sprache der Benutzeroberfläche, aktiviere den Schlaf-Timer, verwalte deine Favoriten (Export/Import/Teilen), sieh dir die Senderquelle und die Datenschutzrichtlinie an.",
    "guide.permissions": "Berechtigungen",
    "guide.permissionsContent": "RadioSphere.be benötigt einige Berechtigungen für den vollen Funktionsumfang: Benachrichtigungen ermöglichen Wiedergabesteuerung auf dem Sperrbildschirm; der Standort wird benötigt, um Chromecast-Geräte in der Nähe zu erkennen; Speicherzugriff ermöglicht das Speichern deiner Aufnahmen auf dem Telefon. Es werden keine persönlichen Daten erfasst oder gesendet. Falls du eine Berechtigung versehentlich abgelehnt hast, kannst du sie unten erneut anfordern oder die Willkommensseite neu laden.",
    "guide.permissionsContentDesktop": "In der Web-Version fordert RadioSphere.be keine Systemberechtigungen an: Die Audiowiedergabe funktioniert nativ in deinem Browser. Es werden keine persönlichen Daten erfasst. Für Sperrbildschirm-Steuerung, integriertes Chromecast und lokale Aufnahmen installiere die kostenlose Android-App aus Google Play.",
    "guide.permissionsContentMobile": "Auf deinem Telefon kann RadioSphere.be (Web) um Erlaubnis bitten, Benachrichtigungen für die Wiedergabesteuerung anzuzeigen. Für mehr Funktionen (Chromecast, lokal gespeicherte Aufnahmen, Sperrbildschirm-Steuerung) installiere die kostenlose Android-App aus Google Play.",
    "guide.permissionsReRequest": "Berechtigungen erneut anfordern",
    "guide.permissionsReopenWelcome": "Willkommensseite neu laden",
    "guide.sleepTimer": "Schlaf-Timer",
    "guide.sleepTimerContent": "Plane das automatische Stoppen der Wiedergabe nach einer Zeitspanne deiner Wahl (15 Min bis 2 Stunden oder benutzerdefiniert). Perfekt zum Einschlafen mit Radio. Aktiviere ihn in den Einstellungen.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Nimm deine Lieblingssendungen als MP3 direkt im Vollbildmodus auf. Der 5-Minuten-Puffer ermöglicht es dir auch, zurückzuspulen und das Verpasste erneut zu hören. Tippe auf REC, um die Aufnahme zu starten (max. 10 Min). Wenn das TBM-Symbol blinkt, bedeutet das, dass der Puffer aktiv ist und im Hintergrund aufnimmt. Tippe auf das blinkende Symbol, um den TimeBack-Player zu öffnen und die letzten Minuten erneut anzuhören.",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Streame deine Radiosender auf deinen Fernseher oder vernetzten Lautsprecher über Chromecast. Tippe auf das Cast-Symbol im Player, um die Übertragung zu starten.",
    "welcome.subtitle": "Weltradio griffbereit",
    "welcome.chooseLanguage": "Sprache wählen",
    "welcome.start": "Loslegen",
    "welcome.stations": "50 000+ Sender",
    "welcome.search": "Erweiterte Suche",
    "welcome.favExport": "Favoriten & Export",
    "welcome.genres": "25 Musikgenres",
    "welcome.sleepTimer": "Schlaf-Timer",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Live-Radio zurückspulen",
    "genre.60s": "60er",
    "genre.70s": "70er",
    "genre.80s": "80er",
    "genre.90s": "90er",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Klassik",
    "genre.country": "Country",
    "genre.electronic": "Elektronik",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latin",
    "genre.metal": "Metal",
    "genre.news": "Nachrichten",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Übertragung auf",
    "cast.controlFromPhone": "Von Ihrem Telefon steuern",
    "cast.connected": "Verbunden",
    "cast.disconnected": "Getrennt",
    "cast.unsupportedBrowser": "Chromecast ist in Google Chrome oder der Android-App verfügbar.",
    "cast.openInChrome": "In Chrome öffnen, um Chromecast zu nutzen",
    "player.live": "LIVE",
    "player.recording": "Aufnahme",
    "player.recordingStarted": "Aufnahme gestartet",
    "player.recordingStopped": "Aufnahme beendet",
    "player.recordingMaxReached": "Maximale Dauer erreicht (10 Min)",
    "player.saveRecording": "Auf dem Telefon speichern",
    "player.shareRecording": "Aufnahme teilen",
    "player.returnToLive": "Zurück zum Live",
    "player.recordPremiumOnly": "Aufnahme ist eine Premium-Funktion",
    "player.fileSaved": "Datei gespeichert!",
    "player.backInTime": "Zurück in die Vergangenheit",
    "player.bufferLoading": "Puffer wird geladen...",
    "player.recordingNotAvailable": "Aufnahme nicht verfügbar",
    "player.recordingContinuesLive": "Zurück zum Live, Aufnahme läuft weiter...",
    "player.codec": "Codec",
    "player.bitrate": "Bitrate",
    "player.language": "Sprache",
    "player.noStreamInfo": "Keine Info vom Stream oder Radio Browser",
    "onboarding.title": "Willkommen bei RadioSphere.be",
    "onboarding.free": "100% Kostenlos",
    "onboarding.freeDesc": "Unbegrenzter Zugang ohne Abo",
    "onboarding.noAds": "Keine Eigenwerbung",
    "onboarding.noAdsDesc": "RadioSphere.be fügt keine Werbung hinzu. Sender können eigene Werbung in ihren Streams enthalten.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Live-Radio zurückspulen",
    "onboarding.cta": "Bald bei Google Play verfügbar",
    "onboarding.dismiss": "Nicht mehr anzeigen",
    "tbmQuota.title": "Zeitreisen ohne Limit?",
    "tbmQuota.description": "Im Web ist die TimeBack Machine eingeschränkt: Zurückspulen bis zu 2 Minuten und Aufnahme bis zu 5 Minuten max, mit einem Gesamtkontingent von 10 Min/Tag auf Mobilgeräten für Stabilität. Die Premium-Version auf Google Play erlaubt Zurückspulen bis zu 5 Minuten und Aufnahmen bis zu 30 Minuten, ohne Kontingent.",
    "tbmQuota.cta": "Bei Google Play herunterladen",
    "tbmQuota.continueLive": "Live weiter hören",
    "tbmQuota.warning": "Genießen Sie die TimeBack Machine unbegrenzt in unserer App!",
    "home.androidTitle": "RadioSphere.be für Android",
    "home.androidDesc": "Hören Sie Ihre Lieblingssender überall, mit Android Auto, Chromecast und der TimeBack Machine.",
    "home.comingSoon": "Demnächst verfügbar",
    "notFound.message": "Hoppla! Seite nicht gefunden",
    "notFound.backHome": "Zurück zur Startseite",
    "footer.poweredByPrefix": "Angetrieben von dem großartigen ",
    "footer.poweredBySuffix": ". Besonderen Dank an Alex Segler für dieses Gemeinschaftsprojekt.",
    "footer.createdBy": "Erstellt von Franck Malherbe",
    "aria.play": "Abspielen",
    "aria.pause": "Pause",
    "aria.addFavorite": "Zu Favoriten hinzufügen",
    "aria.removeFavorite": "Aus Favoriten entfernen",
    "aria.close": "Schließen",
    "aria.refresh": "Aktualisieren"
  },
  ja: {
    "nav.home": "ホーム",
    "nav.search": "検索",
    "nav.explore": "検索と探索",
    "nav.favorites": "お気に入り",
    "nav.premium": "プレミアム",
    "nav.settings": "設定",
    "nav.about": "概要",
    "sidebar.stationCount": "50,000以上のラジオ局、230以上の国、無料、登録不要、追加広告なし。",
    "sidebar.tbmTeaser": "独自機能：TimeBack Machine — ライブラジオを巻き戻し、直近5分間を再生、MP3で番組を録音。時間を巻き戻せるオンラインラジオプレーヤー。",
    "sidebar.tbmHowItWorks": "どう使うの？",
    "sidebar.podcastTeaser": "ポッドキャストはいかが？",
    "tbmModal.title": "TimeBack Machine — 使い方",
    "tbmModal.intro": "TimeBack MachineはRadioSphere.be独自の機能で、オンラインラジオの聴き方を革新します。大事なライブの瞬間を二度と見逃しません！",
    "tbmModal.bufferTitle": "🔄 スマートバッファ（5分間）",
    "tbmModal.bufferDesc": "局を聴き始めると、RadioSphere.beは自動的に直近5分間を循環バッファに記録します。何も有効にする必要はありません：自動で透過的です。",
    "tbmModal.rewindTitle": "⏪ ライブラジオを巻き戻す",
    "tbmModal.rewindDesc": "ニュース、曲、重要な瞬間を聞き逃しましたか？TimeBack Machineを開いて最大5分前まで巻き戻せます。-15s/+15sボタンまたはタイムラインをドラッグして正確にナビゲートできます。",
    "tbmModal.recordTitle": "🔴 MP3で録音",
    "tbmModal.recordDesc": "RECをタップして最大10分間の放送をMP3でキャプチャ。プレーヤーから直接録音できます。インタビュー、楽曲、番組の保存に最適です。",
    "tbmModal.iconTitle": "💡 点滅するTBMアイコン",
    "tbmModal.iconDesc": "プレーヤーでTBMアイコンが点滅している場合、バッファがアクティブで継続的に録音中です。タップしてTimeBack Machineを開き、直近の数分間にアクセスできます。",
    "tbmModal.liveTitle": "📡 ライブに戻る",
    "tbmModal.liveDesc": "いつでも「ライブ」をタップして、即座に局のライブストリームに戻れます。",
    "tbmModal.close": "了解",
    "app.downloadTitle": "モバイルアプリ",
    "app.downloadDesc": "Androidアプリでどこでもラジオを聴きましょう。",
    "app.downloadBtn": "近日公開",
    "footer.tagline": "世界中の何千ものラジオ局を聴けるプレミアムWebプレーヤー。",
    "footer.links": "リンク",
    "footer.contact": "お問い合わせ",
    "footer.rights": "全著作権所有。",
    "privacy.title": "プライバシーポリシー",
    "privacy.lastUpdated": "最終更新",
    "privacy.dataCollection": "データ収集",
    "privacy.dataCollectionDesc": "RadioSphere.beは個人を特定できるデータを一切収集しません。サービスの利用に登録は不要です。",
    "privacy.localStorage": "ローカルストレージ",
    "privacy.localStorageDesc": "すべてのデータはお使いのデバイスにのみ保存されます：",
    "privacy.localStorageFavorites": "お気に入りのステーション",
    "privacy.localStorageLang": "言語設定",
    "privacy.localStorageRecent": "最近再生したステーション",
    "privacy.localStoragePrefs": "インターフェース設定",
    "privacy.analytics": "オーディエンス測定 (Umami Analytics)",
    "privacy.analyticsDesc": "プライバシーに配慮したGDPR準拠の分析ソリューションであるUmami Analyticsを使用しています。Umamiは個人を特定できるデータを収集せず、Cookieを使用せず、すべてのデータは匿名化されています。サービス改善のため、全体的な使用統計（訪問ページ、使用機能）のみを測定します。",
    "privacy.analyticsNoCookies": "トラッキングCookieなし",
    "privacy.analyticsAnonymous": "完全に匿名化されたデータ",
    "privacy.analyticsGDPR": "GDPR準拠",
    "privacy.analyticsNoPersonal": "個人を特定できるデータは収集されません",
    "privacy.analyticsLearnMore": "Umamiのプライバシーポリシーについて詳しく知る",
    "privacy.thirdParty": "サードパーティサービス",
    "privacy.thirdPartyDesc": "オーディオストリームはRadio Browser APIを通じてラジオ局から直接提供されます。ストリームには放送局が直接挿入した広告が含まれる場合があります — RadioSphere.beはそれらをフィルタリングまたはブロックすることができません。",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) は、ウェブサイトのトラフィックを匿名で測定するために使用されています。Cookieは使用されず、個人データも収集されません。集計された匿名統計のみが生成されます。",
    "privacy.permissions": "ウェブブラウザ",
    "privacy.permissionsDesc": "RadioSphere.beは、あらゆる最新のブラウザからアクセスできるウェブサイトです。インストールは不要です。サードパーティのCookieは使用しません。設定を保存するために、ブラウザのローカルストレージ（localStorage）のみを使用します。",
    "privacy.security": "セキュリティ",
    "privacy.securityDesc": "個人データの収集や送信は行われないため、データ漏洩のリスクはありません。",
    "privacy.contact": "お問い合わせ",
    "privacy.contactDesc": "このプライバシーポリシーに関するご質問は以下にご連絡ください：",
    "player.selectStation": "ステーションを選んで再生を開始",
    "home.greeting": "こんにちは 👋",
    "home.recentlyPlayed": "最近再生した局",
    "home.popularStations": "人気のステーション",
    "home.localPopular": "人気のステーション",
    "home.exploreByGenre": "ジャンルで探す",
    "home.yourFavorites": "お気に入り",
    "home.weeklyDiscoveries": "今週のおすすめ",
    "home.popularNearYou": "あなたの近くで人気",
    "home.noFavorites": "お気に入りに追加すると、ここに表示されます",
    "search.title": "検索",
    "search.placeholder": "ステーションを検索...",
    "search.country": "国",
    "search.selectCountry": "国を選択",
    "search.clearCountry": "国をクリア",
    "search.resetFilters": "フィルターをリセット",
    "search.notFoundTitle": "お気に入りの放送局が見つかりませんか？",
    "search.notFoundAddOn": "次の場所から直接追加できます：",
    "search.notFoundEmailUs": "代わりに追加することもできます。次のアドレスまでメールをお送りください：",
    "inAppBrowser.warning": "より快適にご利用いただくため、通常のブラウザで RadioSphere.be を開いてください。",
    "inAppBrowser.openExternal": "ブラウザで開く",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "結果が見つかりません",
    "search.networkError": "ネットワークエラー。ステーションサーバーに接続できません。",
    "search.countriesError": "国リストを読み込めませんでした。",
    "search.retry": "再試行",
    "search.useFilters": "検索やフィルターを使ってステーションを探しましょう",
    "search.genre": "ジャンル",
    "search.language": "言語",
    "search.loadMore": "さらに表示",
    "search.loadingMore": "読み込み中...",
    "search.sortPopularity": "人気順",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "クリック数",
    "search.resultsCount": "件のステーションが見つかりました",
    "favorites.title": "お気に入り",
    "favorites.empty": "お気に入りなし",
    "favorites.emptyDesc": "ステーションのハートをタップしてお気に入りに追加しましょう",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "国別",
    "favorites.unknownCountry": "不明な国",
    "favorites.sortGenre": "ジャンル別",
    "favorites.unknownGenre": "不明なジャンル",
    "favorites.viewList": "リスト",
    "favorites.viewMedium": "サムネイル",
    "favorites.viewLarge": "大サムネイル",
    "favorites.viewSmall": "小サムネイル",
    "premium.title": "RadioSphere.be プレミアム",
    "premium.subtitle": "究極のラジオ体験",
    "premium.active": "プレミアム有効",
    "premium.sleepTimer": "スリープタイマー",
    "premium.sleepTimerDesc": "設定した時間後に自動で再生を停止します",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Android Autoから直接RadioSphere.beを操作できます",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Chromecastを使ってテレビやスマートスピーカーにストリーミング",
    "premium.recorder": "レコーダー",
    "premium.recorderDesc": "番組をMP3で録音し、最大5分前まで巻き戻し可能",
    "premium.monthly": "買い切り — €9.99",
    "premium.buyLifetime": "永久にアンロック",
    "premium.priceNote": "参考価格。最終金額は国によって異なる場合があります。",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "購入を復元",
    "premium.disclaimer": "買い切り、永久アクセス。サブスクリプションなし。",
    "premium.comingSoon": "近日公開",
    "premium.passwordPlaceholder": "アクセスコードを入力",
    "premium.unlock": "解除",
    "premium.lock": "プレミアムをロック",
    "premium.wrongPassword": "コードが違います",
    "premium.unlocked": "プレミアム解除済み！",
    "sleepTimer.title": "スリープタイマー",
    "sleepTimer.desc": "設定時間後に自動で再生を停止します",
    "sleepTimer.off": "オフ",
    "sleepTimer.active": "有効",
    "sleepTimer.remaining": "残り",
    "sleepTimer.cancel": "タイマーを解除",
    "sleepTimer.stopped": "再生は自動的に一時停止されました。",
    "sleepTimer.custom": "カスタム",
    "sleepTimer.customPlaceholder": "分",
    "sleepTimer.customGo": "開始",
    "sleepTimer.15": "15分",
    "sleepTimer.30": "30分",
    "sleepTimer.45": "45分",
    "sleepTimer.60": "1時間",
    "sleepTimer.90": "1時間30分",
    "sleepTimer.120": "2時間",
    "player.nowPlaying": "再生中",
    "player.streamError": "再生エラー",
    "player.streamErrorDesc": "このストリームを再生できません。別のステーションをお試しください。",
    "player.error": "エラー",
    "player.streamUnavailable": "このステーションにはストリームURLがありません。",
    "player.visitWebsite": "ウェブサイトを開く",
    "player.timeout": "タイムアウト",
    "player.timeoutDesc": "ストリームが応答しません。別のステーションをお試しください。",
    "player.unexpectedError": "予期しないエラー",
    "player.unexpectedErrorDesc": "エラーが発生しました。もう一度お試しください。",
    "ssl.title": "安全でない接続",
    "ssl.description": "は暗号化されていない接続（HTTP）を使用しています。この問題はラジオサーバーに起因し、RadioSphere.beの問題ではありません。データが傍受される可能性があります。",
    "ssl.technical": "このステーションのオーディオストリームは、現在のSSL/TLS暗号化基準を満たしていません。RadioSphere.beはこの接続のセキュリティを保証できません。",
    "ssl.acceptRisk": "自己責任で聴く",
    "exit.title": "アプリを閉じますか？",
    "exit.description": "もう一度戻るボタンを押すとRadioSphereを終了します。",
    "exit.confirm": "終了",
    "common.cancel": "キャンセル",
    "settings.title": "設定",
    "settings.language": "言語",
    "settings.languageDesc": "表示言語を選択してください",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "データ使用量",
    "settings.dataWarningDesc": "ラジオの視聴にはインターネット接続を使用し、モバイルデータを消費する場合があります。長時間の視聴にはWi-Fiの利用をおすすめします。",
    "settings.dataDisclaimer": "ローカルデータ",
    "settings.dataDisclaimerDesc": "お気に入りや設定はお使いの端末にローカル保存されます。個人情報がサーバーに送信されることはありません。",
    "settings.radioSource": "ステーションソース",
    "settings.radioSourceDesc": "ステーション一覧はRadio Browserが提供しています。世界中の50,000以上のラジオ局を収録した無料のコミュニティAPIです。",
    "settings.radioSourceLink": "Radio Browserを開く",
    "settings.radioSourceAddStation": "ステーションを追加",
    "settings.analytics": "オーディエンス測定",
    "settings.analyticsDesc": "RadioSphere.beはUmami Analyticsを使用しています。プライバシーに配慮したGDPR準拠の分析ソリューションです。",
    "settings.analyticsNoCookies": "トラッキングクッキーなし",
    "settings.analyticsAnonymous": "完全に匿名化されたデータ",
    "settings.analyticsGDPR": "GDPR準拠",
    "settings.analyticsUsage": "全体的な使用状況のみを測定（ページビュー、使用機能）",
    "settings.analyticsLearnMore": "Umamiについてもっと知る",
    "favorites.manage": "お気に入り管理",
    "favorites.export": "CSVエクスポート",
    "favorites.import": "CSVインポート",
    "favorites.share": "お気に入りを共有",
    "favorites.exported": "お気に入りをエクスポートしました",
    "favorites.imported": "件のお気に入りをインポートしました",
    "favorites.importError": "インポートエラー",
    "favorites.refreshingMetadata": "メタデータを取得中...",
    "favorites.metadataRefreshed": "メタデータを更新しました",
    "favorites.unavailableStations": "見つからない局",
    "favorites.unavailableDesc": "これらの局はRadio Browserに登録されておらず、利用できない可能性があります：",
    "favorites.understood": "了解",
    "favorites.noFavoritesToExport": "エクスポートするお気に入りがありません",
    "favorites.refreshMetadata": "メタデータを更新",
    "settings.privacyPolicy": "プライバシーポリシー",
    "settings.reopenWelcome": "ウェルカムページを再表示",
    "settings.resetApp": "アプリをリセット",
    "settings.resetAppDesc": "すべてのお気に入り、再生履歴、設定を削除します",
    "settings.resetConfirm": "本当によろしいですか？この操作は取り消せません。",
    "settings.resetDone": "アプリをリセットしました",
    "settings.resetButton": "すべて削除",
    "premium.restorePurchases": "購入を復元",
    "premium.restoreSuccess": "購入の復元に成功しました",
    "premium.restoreNone": "復元できる購入がありません",
    "guide.title": "使い方ガイド",
    "guide.button": "使い方ガイド",
    "guide.home": "ホーム",
    "guide.homeContent": "ホーム画面では、最近再生したステーション、人気のステーション、お気に入りへのクイックアクセス、今週のおすすめ、ジャンル別の探索が表示されます。",
    "guide.search": "検索",
    "guide.searchContent": "ステーション名で検索し、国・ジャンル・言語でフィルタリングできます。人気順、アルファベット順、クリック数で並び替えも可能です。ページ下部でさらに読み込めます。",
    "guide.favorites": "お気に入り",
    "guide.favoritesContent": "ステーションのハートアイコンをタップしてお気に入りに追加できます。設定画面からCSVエクスポート・インポート・共有が可能です。",
    "guide.settings": "設定",
    "guide.settingsContent": "表示言語の変更、スリープタイマーの設定、お気に入りの管理（エクスポート・インポート・共有）、ステーションソースやプライバシーポリシーの確認ができます。",
    "guide.permissions": "アクセス許可",
    "guide.permissionsContent": "RadioSphere.beはすべての機能を利用するためにいくつかの許可を求めます：通知はロック画面での再生コントロールの表示に必要です。位置情報は近くのChromecastデバイスの検出に必要です。ストレージへのアクセスは録音をスマートフォンに保存するために必要です。個人データの収集や送信は一切行いません。許可を誤って拒否した場合は、以下から再リクエストするか、ウェルカムページを再読み込みしてください。",
    "guide.permissionsContentDesktop": "Web版のRadioSphere.beはシステム権限を要求しません：オーディオ再生はブラウザでネイティブに動作します。個人データは収集されません。ロック画面コントロール、内蔵Chromecast、ローカル録音をご利用いただくには、Google Playから無料のAndroidアプリをインストールしてください。",
    "guide.permissionsContentMobile": "スマートフォンでは、RadioSphere.be（ウェブ版）が再生コントロール用の通知表示の許可を求める場合があります。より多くの機能（Chromecast、デバイスへの録音保存、ロック画面コントロール）をご利用いただくには、Google Playから無料のAndroidアプリをインストールしてください。",
    "guide.permissionsReRequest": "許可を再リクエスト",
    "guide.permissionsReopenWelcome": "ウェルカムページを再読み込み",
    "guide.sleepTimer": "スリープタイマー",
    "guide.sleepTimerContent": "お好みの時間（15分〜2時間またはカスタム）で自動的に再生を停止できます。ラジオを聴きながら眠りたいときに最適です。設定画面から有効にできます。",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "フルスクリーンプレーヤーからお気に入りの番組をMP3で直接録音できます。5分間のバッファにより、聞き逃した部分を巻き戻して再生することも可能です。RECをタップして録音を開始（最大10分）。TBMアイコンが点滅している場合、バッファがアクティブでバックグラウンドで録音中であることを意味します。点滅するアイコンをタップしてTimeBackプレーヤーを開き、直近の数分間を再生できます。",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Chromecastを使ってラジオ局をテレビやスマートスピーカーにストリーミングできます。プレーヤーのCastアイコンをタップして配信を開始してください。",
    "welcome.subtitle": "世界のラジオを手のひらに",
    "welcome.chooseLanguage": "言語を選択",
    "welcome.start": "はじめる",
    "welcome.stations": "50,000局以上",
    "welcome.search": "高度な検索",
    "welcome.favExport": "お気に入り＆エクスポート",
    "welcome.genres": "25の音楽ジャンル",
    "welcome.sleepTimer": "スリープタイマー",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "ライブ放送を巻き戻し",
    "genre.60s": "60年代",
    "genre.70s": "70年代",
    "genre.80s": "80年代",
    "genre.90s": "90年代",
    "genre.ambient": "アンビエント",
    "genre.blues": "ブルース",
    "genre.chillout": "チルアウト",
    "genre.classical": "クラシック",
    "genre.country": "カントリー",
    "genre.electronic": "エレクトロニック",
    "genre.funk": "ファンク",
    "genre.hiphop": "ヒップホップ",
    "genre.jazz": "ジャズ",
    "genre.latin": "ラテン",
    "genre.metal": "メタル",
    "genre.news": "ニュース",
    "genre.pop": "ポップ",
    "genre.r&b": "R&B",
    "genre.reggae": "レゲエ",
    "genre.rock": "ロック",
    "genre.soul": "ソウル",
    "genre.techno": "テクノ",
    "genre.trance": "トランス",
    "genre.world": "ワールド",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "キャスト中",
    "cast.controlFromPhone": "スマートフォンから操作できます",
    "cast.connected": "接続済み",
    "cast.disconnected": "切断",
    "cast.unsupportedBrowser": "ChromecastはGoogle ChromeまたはAndroidアプリでご利用いただけます。",
    "cast.openInChrome": "Chromeを開いてChromecastを使用してください",
    "player.live": "ライブ",
    "player.recording": "録音中",
    "player.recordingStarted": "録音を開始しました",
    "player.recordingStopped": "録音が終了しました",
    "player.recordingMaxReached": "最大録音時間に達しました（10分）",
    "player.saveRecording": "端末に保存",
    "player.shareRecording": "録音を共有",
    "player.returnToLive": "ライブに戻る",
    "player.recordPremiumOnly": "録音はプレミアム機能です",
    "player.fileSaved": "ファイルを保存しました！",
    "player.backInTime": "過去に戻る",
    "player.bufferLoading": "バッファ読み込み中...",
    "player.recordingNotAvailable": "録音は利用できません",
    "player.recordingContinuesLive": "ライブに戻りました。録音は継続中...",
    "player.codec": "コーデック",
    "player.bitrate": "ビットレート",
    "player.language": "言語",
    "player.noStreamInfo": "ストリームまたはRadio Browserからの情報なし",
    "onboarding.title": "RadioSphere.beへようこそ",
    "onboarding.free": "完全無料",
    "onboarding.freeDesc": "サブスクなしで無制限アクセス",
    "onboarding.noAds": "追加広告ゼロ",
    "onboarding.noAdsDesc": "RadioSphere.beは広告を追加しません。放送局が独自の広告をストリームに含む場合があります。",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "ライブラジオを巻き戻し",
    "onboarding.cta": "Google Playで近日公開",
    "onboarding.dismiss": "再表示しない",
    "tbmQuota.title": "無制限でタイムトラベルしませんか？",
    "tbmQuota.description": "Web版のTimeBack Machineには制限があります：巻き戻しは最大2分、録音は最大5分、モバイルでは安定性のため1日合計10分の上限があります。Google Playで配信中のプレミアム版なら、最大5分の巻き戻しと最大30分の録音が制限なしで可能です。",
    "tbmQuota.cta": "Google Playでダウンロード",
    "tbmQuota.continueLive": "ライブを続ける",
    "tbmQuota.warning": "アプリで無制限のTimeBack Machineをお楽しみください！",
    "home.androidTitle": "RadioSphere.be Android版",
    "home.androidDesc": "Android Auto、Chromecast、TimeBack Machineで、お気に入りの局をどこでも聴けます。",
    "home.comingSoon": "近日公開",
    "notFound.message": "ページが見つかりません",
    "notFound.backHome": "ホームに戻る",
    "footer.poweredByPrefix": "素晴らしい",
    "footer.poweredBySuffix": "によって提供されています。Alex Seglerのコミュニティプロジェクトに感謝します。",
    "footer.createdBy": "Franck Malherbe 作",
    "aria.play": "再生",
    "aria.pause": "一時停止",
    "aria.addFavorite": "お気に入りに追加",
    "aria.removeFavorite": "お気に入りから削除",
    "aria.close": "閉じる",
    "aria.refresh": "更新"
  },
  it: {
    "nav.home": "Home",
    "nav.search": "Cerca",
    "nav.explore": "Cerca ed esplora",
    "nav.favorites": "Preferiti",
    "nav.premium": "Premium",
    "nav.settings": "Impostazioni",
    "nav.about": "Info",
    "sidebar.stationCount": "Oltre 50.000 stazioni radio in più di 230 paesi, gratis, senza registrazione, senza pubblicità aggiunte.",
    "sidebar.tbmTeaser": "La nostra esclusiva: la TimeBack Machine — riavvolgi la radio in diretta, riascolta gli ultimi 5 minuti, registra i tuoi programmi in MP3. Il lettore radio online che ti permette di tornare indietro nel tempo.",
    "sidebar.tbmHowItWorks": "Come funziona?",
    "sidebar.podcastTeaser": "Voglia di un podcast?",
    "tbmModal.title": "TimeBack Machine — Come funziona?",
    "tbmModal.intro": "La TimeBack Machine è un'esclusiva di RadioSphere.be che rivoluziona l'ascolto della radio online. Non perdere mai più un momento importante in diretta!",
    "tbmModal.bufferTitle": "🔄 Buffer intelligente (5 minuti)",
    "tbmModal.bufferDesc": "Appena ascolti una stazione, RadioSphere.be registra automaticamente gli ultimi 5 minuti in un buffer circolare. Non devi attivare nulla: è automatico e trasparente.",
    "tbmModal.rewindTitle": "⏪ Riavvolgi la diretta",
    "tbmModal.rewindDesc": "Hai perso una notizia, una canzone o un momento importante? Apri la TimeBack Machine e riavvolgi fino a 5 minuti. Usa i pulsanti -15s/+15s o trascina la timeline per navigare con precisione.",
    "tbmModal.recordTitle": "🔴 Registra in MP3",
    "tbmModal.recordDesc": "Premi REC per catturare fino a 10 minuti di trasmissione in MP3, direttamente dal lettore. Perfetto per salvare interviste, brani o interi programmi.",
    "tbmModal.iconTitle": "💡 L'icona TBM lampeggiante",
    "tbmModal.iconDesc": "Quando l'icona TBM lampeggia nel lettore, significa che il buffer è attivo e registra continuamente. Toccala per aprire la TimeBack Machine e accedere agli ultimi minuti di ascolto.",
    "tbmModal.liveTitle": "📡 Torna alla diretta",
    "tbmModal.liveDesc": "In qualsiasi momento, premi 'IN DIRETTA' per tornare istantaneamente allo streaming live della tua stazione.",
    "tbmModal.close": "Ho capito",
    "app.downloadTitle": "App Mobile",
    "app.downloadDesc": "Ascolta le tue radio ovunque con l'app Android.",
    "app.downloadBtn": "Prossimamente",
    "footer.tagline": "Il web player premium per ascoltare migliaia di stazioni radio da tutto il mondo.",
    "footer.links": "Link utili",
    "footer.contact": "Contatti",
    "footer.rights": "Tutti i diritti riservati.",
    "privacy.title": "Informativa sulla privacy",
    "privacy.lastUpdated": "Ultimo aggiornamento",
    "privacy.dataCollection": "Raccolta dati",
    "privacy.dataCollectionDesc": "RadioSphere.be non raccoglie alcun dato personale identificabile. Non è richiesta alcuna registrazione per utilizzare il servizio.",
    "privacy.localStorage": "Archiviazione locale",
    "privacy.localStorageDesc": "Tutti i dati sono archiviati esclusivamente sul tuo dispositivo:",
    "privacy.localStorageFavorites": "Le tue stazioni preferite",
    "privacy.localStorageLang": "La tua preferenza di lingua",
    "privacy.localStorageRecent": "Le tue stazioni ascoltate di recente",
    "privacy.localStoragePrefs": "Le tue impostazioni dell'interfaccia",
    "privacy.analytics": "Misurazione del pubblico (Umami Analytics)",
    "privacy.analyticsDesc": "Utilizziamo Umami Analytics, una soluzione rispettosa della privacy e conforme al GDPR. Umami non raccoglie dati personali identificabili, non usa cookie e tutti i dati sono anonimizzati.",
    "privacy.analyticsNoCookies": "Nessun cookie di tracciamento",
    "privacy.analyticsAnonymous": "Dati completamente anonimizzati",
    "privacy.analyticsGDPR": "Conforme al GDPR",
    "privacy.analyticsNoPersonal": "Nessun dato personale identificabile raccolto",
    "privacy.analyticsLearnMore": "Scopri di più sulla privacy di Umami",
    "privacy.thirdParty": "Servizi di terze parti",
    "privacy.thirdPartyDesc": "I flussi audio sono forniti direttamente dalle stazioni radio tramite l'API Radio Browser. I flussi possono contenere pubblicità inserita dalle stazioni stesse — RadioSphere.be non può filtrarla né bloccarla.",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) è utilizzato per misurare il traffico del sito in modo anonimo. Non vengono utilizzati cookie, non vengono raccolti dati personali.",
    "privacy.permissions": "Browser web",
    "privacy.permissionsDesc": "RadioSphere.be è un sito web accessibile da qualsiasi browser moderno. Non è richiesta alcuna installazione. Il sito non utilizza cookie di terze parti.",
    "privacy.security": "Sicurezza",
    "privacy.securityDesc": "Non vengono raccolti né trasmessi dati personali. I tuoi preferiti e le tue impostazioni non lasciano mai il tuo dispositivo.",
    "privacy.contact": "Contatti",
    "privacy.contactDesc": "Per qualsiasi domanda sulla presente informativa sulla privacy, puoi contattarci a:",
    "player.selectStation": "Seleziona una stazione per iniziare",
    "home.greeting": "Ciao 👋",
    "home.recentlyPlayed": "Ascoltate di recente",
    "home.popularStations": "Stazioni popolari",
    "home.localPopular": "Stazioni popolari",
    "home.exploreByGenre": "Esplora per genere",
    "home.yourFavorites": "I tuoi preferiti",
    "home.weeklyDiscoveries": "Scoperte della settimana",
    "home.popularNearYou": "Popolari vicino a te",
    "home.noFavorites": "Aggiungi dei preferiti per trovarli qui",
    "search.title": "Cerca",
    "search.placeholder": "Cerca una stazione...",
    "search.country": "Paese",
    "search.selectCountry": "Scegli un paese",
    "search.clearCountry": "Cancella paese",
    "search.resetFilters": "Reimposta filtri",
    "search.notFoundTitle": "Non trovi la tua stazione preferita?",
    "search.notFoundAddOn": "Puoi aggiungerla direttamente su",
    "search.notFoundEmailUs": "Possiamo anche provare ad aggiungerla per te: scrivici a",
    "inAppBrowser.warning": "Per una migliore esperienza, apri RadioSphere.be nel tuo browser abituale.",
    "inAppBrowser.openExternal": "Apri nel browser",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Nessun risultato",
    "search.networkError": "Errore di rete. Impossibile contattare il server delle stazioni.",
    "search.countriesError": "Impossibile caricare l'elenco dei paesi.",
    "search.retry": "Riprova",
    "search.useFilters": "Usa la ricerca o i filtri per trovare stazioni",
    "search.genre": "Genere",
    "search.language": "Lingua",
    "search.loadMore": "Altre stazioni",
    "search.loadingMore": "Caricamento...",
    "search.sortPopularity": "Popolarità",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Clic",
    "search.resultsCount": "stazioni trovate",
    "favorites.title": "Preferiti",
    "favorites.empty": "Nessun preferito",
    "favorites.emptyDesc": "Tocca il cuore di una stazione per aggiungerla ai preferiti",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Per paese",
    "favorites.unknownCountry": "Paese sconosciuto",
    "favorites.sortGenre": "Per genere",
    "favorites.unknownGenre": "Genere sconosciuto",
    "favorites.viewList": "Lista",
    "favorites.viewMedium": "Miniature",
    "favorites.viewLarge": "Miniature grandi",
    "favorites.viewSmall": "Miniature piccole",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "L'esperienza radio definitiva",
    "premium.active": "Premium attivo",
    "premium.sleepTimer": "Timer di spegnimento",
    "premium.sleepTimerDesc": "Interrompe automaticamente la riproduzione dopo un tempo configurabile",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Controlla RadioSphere.be direttamente da Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Trasmetti le tue stazioni sulla TV o altoparlante connesso tramite Chromecast",
    "premium.recorder": "Registratore",
    "premium.recorderDesc": "Registra i tuoi programmi in MP3 e riavvolgi fino a 5 minuti indietro",
    "premium.monthly": "Acquisto unico — 9,99€",
    "premium.buyLifetime": "Sblocca per sempre",
    "premium.priceNote": "Prezzo indicativo. L'importo finale può variare in base al paese.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Ripristina acquisto",
    "premium.disclaimer": "Acquisto unico, accesso a vita. Nessun abbonamento.",
    "premium.comingSoon": "Prossimamente",
    "premium.passwordPlaceholder": "Inserisci il codice di accesso",
    "premium.unlock": "Sblocca",
    "premium.lock": "Blocca Premium",
    "premium.wrongPassword": "Codice errato",
    "premium.unlocked": "Premium sbloccato!",
    "sleepTimer.title": "Timer di spegnimento",
    "sleepTimer.desc": "Interrompe automaticamente la riproduzione dopo un tempo",
    "sleepTimer.off": "Disattivato",
    "sleepTimer.active": "Attivo",
    "sleepTimer.remaining": "Rimanente",
    "sleepTimer.cancel": "Annulla timer",
    "sleepTimer.stopped": "La riproduzione è stata messa in pausa automaticamente.",
    "sleepTimer.custom": "Personalizzato",
    "sleepTimer.customPlaceholder": "Minuti",
    "sleepTimer.customGo": "Vai",
    "sleepTimer.15": "15 min",
    "sleepTimer.30": "30 min",
    "sleepTimer.45": "45 min",
    "sleepTimer.60": "1 ora",
    "sleepTimer.90": "1h30",
    "sleepTimer.120": "2 ore",
    "player.nowPlaying": "In riproduzione",
    "player.streamError": "Errore di riproduzione",
    "player.streamErrorDesc": "Impossibile riprodurre questo flusso. Prova un'altra stazione.",
    "player.error": "Errore",
    "player.streamUnavailable": "Questa stazione non ha un URL di flusso.",
    "player.visitWebsite": "Visita il sito",
    "player.timeout": "Timeout",
    "player.timeoutDesc": "Il flusso non risponde. Prova un'altra stazione.",
    "player.unexpectedError": "Errore imprevisto",
    "player.unexpectedErrorDesc": "Si è verificato un errore. Riprova.",
    "ssl.title": "Connessione non sicura",
    "ssl.description": "utilizza una connessione non crittografata (HTTP). Questo problema proviene dal server della radio, non da RadioSphere.be.",
    "ssl.technical": "Il flusso audio di questa stazione non rispetta gli standard di crittografia SSL/TLS attuali. RadioSphere.be non può garantire la sicurezza di questa connessione.",
    "ssl.acceptRisk": "Ascolta a mio rischio",
    "exit.title": "Chiudere l'app?",
    "exit.description": "Premi indietro ancora una volta per uscire da RadioSphere.",
    "exit.confirm": "Esci",
    "common.cancel": "Annulla",
    "settings.title": "Impostazioni",
    "settings.language": "Lingua",
    "settings.languageDesc": "Scegli la lingua dell'interfaccia",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Utilizzo dei dati",
    "settings.dataWarningDesc": "L'ascolto delle stazioni radio utilizza la connessione internet e può consumare dati mobili. Consigliamo il Wi-Fi per un uso prolungato.",
    "settings.dataDisclaimer": "Dati locali",
    "settings.dataDisclaimerDesc": "I tuoi preferiti e le impostazioni sono archiviati localmente sul dispositivo. Nessun dato personale viene inviato a un server.",
    "settings.radioSource": "Fonte delle stazioni",
    "settings.radioSourceDesc": "L'elenco delle stazioni è fornito da Radio Browser, un'API comunitaria libera e gratuita con oltre 50.000 stazioni radio nel mondo.",
    "settings.radioSourceLink": "Visita Radio Browser",
    "settings.radioSourceAddStation": "Aggiungi una stazione",
    "settings.analytics": "Misurazione del pubblico",
    "settings.analyticsDesc": "RadioSphere.be utilizza Umami Analytics, una soluzione rispettosa della privacy e conforme al GDPR.",
    "settings.analyticsNoCookies": "Nessun cookie di tracciamento",
    "settings.analyticsAnonymous": "Dati completamente anonimizzati",
    "settings.analyticsGDPR": "Conforme al GDPR",
    "settings.analyticsUsage": "Misura solo l'uso globale (pagine visitate, funzionalità utilizzate)",
    "settings.analyticsLearnMore": "Scopri di più su Umami",
    "favorites.manage": "Gestisci preferiti",
    "favorites.export": "Esporta in CSV",
    "favorites.import": "Importa CSV",
    "favorites.share": "Condividi i miei preferiti",
    "favorites.exported": "Preferiti esportati",
    "favorites.imported": "preferiti importati",
    "favorites.importError": "Errore di importazione",
    "favorites.refreshingMetadata": "Recupero metadati...",
    "favorites.metadataRefreshed": "Metadati aggiornati",
    "favorites.unavailableStations": "Stazioni non trovate",
    "favorites.unavailableDesc": "Queste stazioni non sono più elencate su Radio Browser e potrebbero non essere più disponibili:",
    "favorites.understood": "Capito",
    "favorites.noFavoritesToExport": "Nessun preferito da esportare",
    "favorites.refreshMetadata": "Aggiorna metadati",
    "settings.privacyPolicy": "Informativa sulla privacy",
    "settings.reopenWelcome": "Riaprire pagina di benvenuto",
    "settings.resetApp": "Reimposta applicazione",
    "settings.resetAppDesc": "Elimina tutti i preferiti, le stazioni recenti e le impostazioni",
    "settings.resetConfirm": "Sei sicuro? Questa azione è irreversibile.",
    "settings.resetDone": "Applicazione reimpostata",
    "settings.resetButton": "Elimina tutto",
    "premium.restorePurchases": "Ripristina acquisti",
    "premium.restoreSuccess": "Acquisti ripristinati con successo",
    "premium.restoreNone": "Nessun acquisto da ripristinare",
    "guide.title": "Guida utente",
    "guide.button": "Guida utente",
    "guide.home": "Home",
    "guide.homeContent": "La schermata iniziale mostra le stazioni ascoltate di recente, le stazioni popolari, l'accesso rapido ai preferiti, le scoperte settimanali e l'esplorazione per genere.",
    "guide.search": "Cerca",
    "guide.searchContent": "Cerca una stazione per nome, poi filtra per paese, genere o lingua. Ordina i risultati per popolarità, ordine alfabetico o numero di clic.",
    "guide.favorites": "Preferiti",
    "guide.favoritesContent": "Tocca il cuore di una stazione per aggiungerla ai preferiti. Dalle impostazioni puoi esportare i preferiti in CSV, importarli o condividerli.",
    "guide.settings": "Impostazioni",
    "guide.settingsContent": "Cambia la lingua dell'interfaccia, attiva il timer di spegnimento, gestisci i preferiti (esporta/importa/condividi), consulta la fonte delle stazioni e l'informativa sulla privacy.",
    "guide.permissions": "Permessi",
    "guide.permissionsContent": "RadioSphere.be richiede alcuni permessi per funzionare completamente: le notifiche permettono i controlli di riproduzione sulla schermata di blocco; la posizione serve per rilevare dispositivi Chromecast nelle vicinanze; l'accesso all'archiviazione consente di salvare le registrazioni sul telefono. Nessun dato personale viene raccolto né inviato.",
    "guide.permissionsContentDesktop": "Nella versione web, RadioSphere.be non richiede alcun permesso di sistema: la riproduzione audio funziona nativamente nel tuo browser. Nessun dato personale viene raccolto. Per usufruire dei controlli sulla schermata di blocco, Chromecast integrato e registrazione locale, installa l'app Android gratuita da Google Play.",
    "guide.permissionsContentMobile": "Sul tuo telefono, RadioSphere.be (web) può chiedere il permesso di mostrare notifiche per i controlli di riproduzione. Per ulteriori funzioni (Chromecast, registrazioni salvate sul dispositivo, controlli schermata di blocco), installa l'app Android gratuita da Google Play.",
    "guide.permissionsReRequest": "Richiedi nuovamente i permessi",
    "guide.permissionsReopenWelcome": "Ricarica pagina di benvenuto",
    "guide.sleepTimer": "Timer di spegnimento",
    "guide.sleepTimerContent": "Programma l'arresto automatico della riproduzione dopo un tempo a scelta (da 15 min a 2 ore o durata personalizzata). Ideale per addormentarsi con la radio.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Registra i tuoi programmi preferiti in MP3 direttamente dal lettore a schermo intero. Il buffer di 5 minuti ti permette anche di riavvolgere e riascoltare ciò che hai appena perso. Premi REC per avviare la registrazione (max 10 min).",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Trasmetti le tue stazioni radio sulla TV o altoparlante connesso tramite Chromecast. Tocca l'icona Cast nel lettore per iniziare.",
    "welcome.subtitle": "La radio mondiale a portata di mano",
    "welcome.chooseLanguage": "Scegli la lingua",
    "welcome.start": "Inizia",
    "welcome.stations": "50.000+ stazioni",
    "welcome.search": "Ricerca avanzata",
    "welcome.favExport": "Preferiti ed esportazione",
    "welcome.genres": "25 generi musicali",
    "welcome.sleepTimer": "Timer di spegnimento",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Riascolta la diretta",
    "genre.60s": "Anni 60",
    "genre.70s": "Anni 70",
    "genre.80s": "Anni 80",
    "genre.90s": "Anni 90",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Classica",
    "genre.country": "Country",
    "genre.electronic": "Elettronica",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latina",
    "genre.metal": "Metal",
    "genre.news": "Notizie",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Trasmissione su",
    "cast.controlFromPhone": "Controlla dal telefono",
    "cast.connected": "Connesso",
    "cast.disconnected": "Disconnesso",
    "cast.unsupportedBrowser": "Chromecast è disponibile in Google Chrome o nell'app Android.",
    "cast.openInChrome": "Apri in Chrome per usare Chromecast",
    "player.live": "IN DIRETTA",
    "player.recording": "Registrazione",
    "player.recordingStarted": "Registrazione avviata",
    "player.recordingStopped": "Registrazione terminata",
    "player.recordingMaxReached": "Durata massima raggiunta (10 min)",
    "player.saveRecording": "Salva sul telefono",
    "player.shareRecording": "Condividi registrazione",
    "player.returnToLive": "Torna alla diretta",
    "player.recordPremiumOnly": "La registrazione è una funzionalità Premium",
    "player.fileSaved": "File salvato!",
    "player.backInTime": "Torna nel passato",
    "player.bufferLoading": "Caricamento buffer...",
    "player.recordingNotAvailable": "Registrazione non disponibile",
    "player.recordingContinuesLive": "Torna alla diretta, registrazione in corso...",
    "player.codec": "Codec",
    "player.bitrate": "Bitrate",
    "player.language": "Lingua",
    "player.noStreamInfo": "Nessuna info dal flusso o Radio Browser",
    "onboarding.title": "Benvenuto su RadioSphere.be",
    "onboarding.free": "100% Gratis",
    "onboarding.freeDesc": "Accesso illimitato senza abbonamento",
    "onboarding.noAds": "Zero pubblicità aggiunta",
    "onboarding.noAdsDesc": "Nessuna pubblicità aggiunta da RadioSphere.be. Le stazioni possono includere i propri annunci nei flussi.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Riavvolgi la radio in diretta",
    "onboarding.cta": "Prossimamente su Google Play",
    "onboarding.dismiss": "Non mostrare più",
    "tbmQuota.title": "Vuoi viaggiare nel tempo senza limiti?",
    "tbmQuota.description": "Sul web, la TimeBack Machine è limitata: riavvolgimento fino a 2 minuti e registrazione fino a 5 minuti max, con una quota complessiva di 10 min/giorno su mobile per garantire la stabilità. La versione premium disponibile su Google Play permette di riavvolgere fino a 5 minuti e registrare fino a 30 minuti, senza quota.",
    "tbmQuota.cta": "Scarica da Google Play",
    "tbmQuota.continueLive": "Continua in diretta",
    "tbmQuota.warning": "Goditi la TimeBack Machine illimitata sulla nostra app!",
    "home.androidTitle": "RadioSphere.be su Android",
    "home.androidDesc": "Ascolta le tue stazioni preferite ovunque, con Android Auto, Chromecast e la TimeBack Machine.",
    "home.comingSoon": "Prossimamente",
    "notFound.message": "Ops! Pagina non trovata",
    "notFound.backHome": "Torna alla home",
    "footer.poweredByPrefix": "Alimentato dall'incredibile ",
    "footer.poweredBySuffix": ". Grazie ad Alex Segler per questo progetto comunitario.",
    "footer.createdBy": "Creato da Franck Malherbe",
    "aria.play": "Riproduci",
    "aria.pause": "Pausa",
    "aria.addFavorite": "Aggiungi ai preferiti",
    "aria.removeFavorite": "Rimuovi dai preferiti",
    "aria.close": "Chiudi",
    "aria.refresh": "Aggiorna"
  },
  nl: {
    "nav.home": "Home",
    "nav.search": "Zoeken",
    "nav.explore": "Zoeken en ontdekken",
    "nav.favorites": "Favorieten",
    "nav.premium": "Premium",
    "nav.settings": "Instellingen",
    "nav.about": "Over",
    "sidebar.stationCount": "Meer dan 50.000 radiostations in meer dan 230 landen, gratis, zonder registratie, zonder toegevoegde advertenties.",
    "sidebar.tbmTeaser": "Onze exclusiviteit: de TimeBack Machine — spoel live radio terug, herbeluister de laatste 5 minuten, neem je programma's op als MP3. De online radiospeler waarmee je terug in de tijd kunt.",
    "sidebar.tbmHowItWorks": "Hoe werkt het?",
    "sidebar.podcastTeaser": "Zin in een podcast?",
    "tbmModal.title": "TimeBack Machine — Hoe werkt het?",
    "tbmModal.intro": "De TimeBack Machine is een exclusieve functie van RadioSphere.be die het online radio luisteren revolutioneert. Mis nooit meer een belangrijk live moment!",
    "tbmModal.bufferTitle": "🔄 Slimme buffer (5 minuten)",
    "tbmModal.bufferDesc": "Zodra je naar een station luistert, neemt RadioSphere.be automatisch de laatste 5 minuten op in een circulaire buffer. Je hoeft niets te activeren: het is automatisch en transparant.",
    "tbmModal.rewindTitle": "⏪ Live radio terugspoelen",
    "tbmModal.rewindDesc": "Heb je een nieuwsflits, een liedje of een belangrijk moment gemist? Open de TimeBack Machine en spoel tot 5 minuten terug. Gebruik de -15s/+15s knoppen of sleep de tijdlijn om nauwkeurig te navigeren.",
    "tbmModal.recordTitle": "🔴 Opnemen als MP3",
    "tbmModal.recordDesc": "Druk op REC om tot 10 minuten uitzending op te nemen als MP3, rechtstreeks vanuit de speler. Perfect om interviews, nummers of hele programma's op te slaan.",
    "tbmModal.iconTitle": "💡 Het knipperende TBM-icoon",
    "tbmModal.iconDesc": "Wanneer het TBM-icoon knippert in de speler, betekent dit dat de buffer actief is en continu opneemt. Tik erop om de TimeBack Machine te openen en je laatste minuten luisteren te openen.",
    "tbmModal.liveTitle": "📡 Terug naar live",
    "tbmModal.liveDesc": "Op elk moment, druk op 'LIVE' om direct terug te keren naar de livestream van je station.",
    "tbmModal.close": "Begrepen",
    "app.downloadTitle": "Mobiele app",
    "app.downloadDesc": "Luister overal naar je radio's met de Android-app.",
    "app.downloadBtn": "Binnenkort beschikbaar",
    "footer.tagline": "De premium webspeler om duizenden radiostations wereldwijd te beluisteren.",
    "footer.links": "Nuttige links",
    "footer.contact": "Contact",
    "footer.rights": "Alle rechten voorbehouden.",
    "privacy.title": "Privacybeleid",
    "privacy.lastUpdated": "Laatst bijgewerkt",
    "privacy.dataCollection": "Gegevensverzameling",
    "privacy.dataCollectionDesc": "RadioSphere.be verzamelt geen persoonlijk identificeerbare gegevens. Geen registratie vereist om de dienst te gebruiken.",
    "privacy.localStorage": "Lokale opslag",
    "privacy.localStorageDesc": "Alle gegevens worden uitsluitend op je apparaat opgeslagen:",
    "privacy.localStorageFavorites": "Je favoriete stations",
    "privacy.localStorageLang": "Je taalvoorkeur",
    "privacy.localStorageRecent": "Je recent beluisterde stations",
    "privacy.localStoragePrefs": "Je interface-instellingen",
    "privacy.analytics": "Publieksmeting (Umami Analytics)",
    "privacy.analyticsDesc": "We gebruiken Umami Analytics, een privacyvriendelijke en AVG-conforme analyseoplossing. Umami verzamelt geen persoonlijk identificeerbare gegevens, gebruikt geen cookies en alle gegevens zijn geanonimiseerd.",
    "privacy.analyticsNoCookies": "Geen trackingcookies",
    "privacy.analyticsAnonymous": "Volledig geanonimiseerde gegevens",
    "privacy.analyticsGDPR": "AVG-conform",
    "privacy.analyticsNoPersonal": "Geen persoonlijk identificeerbare gegevens verzameld",
    "privacy.analyticsLearnMore": "Meer informatie over het privacybeleid van Umami",
    "privacy.thirdParty": "Diensten van derden",
    "privacy.thirdPartyDesc": "Audiostreams worden rechtstreeks door de radiostations geleverd via de Radio Browser API. Streams kunnen advertenties bevatten die door de stations zelf zijn ingevoegd — RadioSphere.be kan deze niet filteren of blokkeren.",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) wordt gebruikt om het websiteverkeer anoniem te meten. Geen cookies, geen persoonlijke gegevens.",
    "privacy.permissions": "Webbrowser",
    "privacy.permissionsDesc": "RadioSphere.be is een website die toegankelijk is vanuit elke moderne browser. Geen installatie vereist. De site gebruikt geen cookies van derden.",
    "privacy.security": "Beveiliging",
    "privacy.securityDesc": "Aangezien er geen persoonlijke gegevens worden verzameld of verzonden, is er geen risico op datalekken. Je favorieten en voorkeuren verlaten nooit je apparaat.",
    "privacy.contact": "Contact",
    "privacy.contactDesc": "Voor vragen over dit privacybeleid kun je contact met ons opnemen via:",
    "player.selectStation": "Selecteer een station om te beginnen",
    "home.greeting": "Hallo 👋",
    "home.recentlyPlayed": "Recent beluisterd",
    "home.popularStations": "Populaire stations",
    "home.localPopular": "Populaire stations",
    "home.exploreByGenre": "Verken per genre",
    "home.yourFavorites": "Je favorieten",
    "home.weeklyDiscoveries": "Ontdekkingen van de week",
    "home.popularNearYou": "Populair bij jou in de buurt",
    "home.noFavorites": "Voeg favorieten toe om ze hier te zien",
    "search.title": "Zoeken",
    "search.placeholder": "Zoek een station...",
    "search.country": "Land",
    "search.selectCountry": "Kies een land",
    "search.clearCountry": "Land wissen",
    "search.resetFilters": "Filters resetten",
    "search.notFoundTitle": "Kun je je favoriete zender niet vinden?",
    "search.notFoundAddOn": "Je kunt hem direct toevoegen op",
    "search.notFoundEmailUs": "We kunnen ook proberen hem voor je toe te voegen: stuur ons een e-mail naar",
    "inAppBrowser.warning": "Voor de beste ervaring, open RadioSphere.be in je gewone browser.",
    "inAppBrowser.openExternal": "Openen in browser",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Geen resultaten",
    "search.networkError": "Netwerkfout. Kan de stationserver niet bereiken.",
    "search.countriesError": "Kan de landenlijst niet laden.",
    "search.retry": "Opnieuw proberen",
    "search.useFilters": "Gebruik de zoekbalk of filters om stations te vinden",
    "search.genre": "Genre",
    "search.language": "Taal",
    "search.loadMore": "Meer stations",
    "search.loadingMore": "Laden...",
    "search.sortPopularity": "Populariteit",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Klikken",
    "search.resultsCount": "stations gevonden",
    "favorites.title": "Favorieten",
    "favorites.empty": "Geen favorieten",
    "favorites.emptyDesc": "Tik op het hart van een station om het aan je favorieten toe te voegen",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Per land",
    "favorites.unknownCountry": "Onbekend land",
    "favorites.sortGenre": "Per genre",
    "favorites.unknownGenre": "Onbekend genre",
    "favorites.viewList": "Lijst",
    "favorites.viewMedium": "Miniaturen",
    "favorites.viewLarge": "Grote miniaturen",
    "favorites.viewSmall": "Kleine miniaturen",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "De ultieme radio-ervaring",
    "premium.active": "Premium actief",
    "premium.sleepTimer": "Slaaptimer",
    "premium.sleepTimerDesc": "Stopt het afspelen automatisch na een instelbare tijd",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Bedien RadioSphere.be rechtstreeks vanuit Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Stream je stations naar je TV of verbonden speaker via Chromecast",
    "premium.recorder": "Recorder",
    "premium.recorderDesc": "Neem je programma's op als MP3 en spoel tot 5 minuten terug",
    "premium.monthly": "Eenmalige aankoop — €9,99",
    "premium.buyLifetime": "Voor altijd ontgrendelen",
    "premium.priceNote": "Indicatieve prijs. Het eindbedrag kan per land verschillen.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Aankoop herstellen",
    "premium.disclaimer": "Eenmalige aankoop, levenslange toegang. Geen abonnement.",
    "premium.comingSoon": "Binnenkort",
    "premium.passwordPlaceholder": "Voer toegangscode in",
    "premium.unlock": "Ontgrendelen",
    "premium.lock": "Premium vergrendelen",
    "premium.wrongPassword": "Verkeerde code",
    "premium.unlocked": "Premium ontgrendeld!",
    "sleepTimer.title": "Slaaptimer",
    "sleepTimer.desc": "Stopt het afspelen automatisch na een ingestelde tijd",
    "sleepTimer.off": "Uit",
    "sleepTimer.active": "Actief",
    "sleepTimer.remaining": "Resterend",
    "sleepTimer.cancel": "Timer annuleren",
    "sleepTimer.stopped": "Het afspelen is automatisch gepauzeerd.",
    "sleepTimer.custom": "Aangepast",
    "sleepTimer.customPlaceholder": "Minuten",
    "sleepTimer.customGo": "Go",
    "sleepTimer.15": "15 min",
    "sleepTimer.30": "30 min",
    "sleepTimer.45": "45 min",
    "sleepTimer.60": "1 uur",
    "sleepTimer.90": "1u30",
    "sleepTimer.120": "2 uur",
    "player.nowPlaying": "Nu aan het spelen",
    "player.streamError": "Afspeelfout",
    "player.streamErrorDesc": "Kan deze stream niet afspelen. Probeer een ander station.",
    "player.error": "Fout",
    "player.streamUnavailable": "Dit station heeft geen stream-URL.",
    "player.visitWebsite": "Website bezoeken",
    "player.timeout": "Timeout",
    "player.timeoutDesc": "De stream reageert niet. Probeer een ander station.",
    "player.unexpectedError": "Onverwachte fout",
    "player.unexpectedErrorDesc": "Er is een fout opgetreden. Probeer het opnieuw.",
    "ssl.title": "Onbeveiligde verbinding",
    "ssl.description": "gebruikt een onversleutelde verbinding (HTTP). Dit probleem komt van de radioserver, niet van RadioSphere.be.",
    "ssl.technical": "De audiostream van dit station voldoet niet aan de huidige SSL/TLS-versleutelingsstandaarden. RadioSphere.be kan de veiligheid van deze verbinding niet garanderen.",
    "ssl.acceptRisk": "Luisteren op eigen risico",
    "exit.title": "App sluiten?",
    "exit.description": "Druk nog een keer op terug om RadioSphere af te sluiten.",
    "exit.confirm": "Afsluiten",
    "common.cancel": "Annuleren",
    "settings.title": "Instellingen",
    "settings.language": "Taal",
    "settings.languageDesc": "Kies de taal van de interface",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Datagebruik",
    "settings.dataWarningDesc": "Het luisteren naar radiostations gebruikt je internetverbinding en kan mobiele data verbruiken. We raden Wi-Fi aan voor langdurig luisteren.",
    "settings.dataDisclaimer": "Lokale gegevens",
    "settings.dataDisclaimerDesc": "Je favorieten en voorkeuren worden lokaal op je apparaat opgeslagen. Geen persoonlijke gegevens worden naar een server verzonden.",
    "settings.radioSource": "Stationbron",
    "settings.radioSourceDesc": "De stationslijst wordt geleverd door Radio Browser, een gratis en open community-API met meer dan 50.000 radiostations wereldwijd.",
    "settings.radioSourceLink": "Bezoek Radio Browser",
    "settings.radioSourceAddStation": "Voeg een station toe",
    "settings.analytics": "Publieksmeting",
    "settings.analyticsDesc": "RadioSphere.be gebruikt Umami Analytics, een privacyvriendelijke en AVG-conforme analyseoplossing.",
    "settings.analyticsNoCookies": "Geen trackingcookies",
    "settings.analyticsAnonymous": "Volledig geanonimiseerde gegevens",
    "settings.analyticsGDPR": "AVG-conform",
    "settings.analyticsUsage": "Meet alleen het globale gebruik (bekeken pagina's, gebruikte functies)",
    "settings.analyticsLearnMore": "Meer informatie over Umami",
    "favorites.manage": "Favorieten beheren",
    "favorites.export": "Exporteren als CSV",
    "favorites.import": "CSV importeren",
    "favorites.share": "Mijn favorieten delen",
    "favorites.exported": "Favorieten geëxporteerd",
    "favorites.imported": "favorieten geïmporteerd",
    "favorites.importError": "Importfout",
    "favorites.refreshingMetadata": "Metadata ophalen...",
    "favorites.metadataRefreshed": "Metadata bijgewerkt",
    "favorites.unavailableStations": "Stations niet gevonden",
    "favorites.unavailableDesc": "Deze stations staan niet meer op Radio Browser en zijn mogelijk niet meer beschikbaar:",
    "favorites.understood": "Begrepen",
    "favorites.noFavoritesToExport": "Geen favorieten om te exporteren",
    "favorites.refreshMetadata": "Metadata bijwerken",
    "settings.privacyPolicy": "Privacybeleid",
    "settings.reopenWelcome": "Welkomstpagina opnieuw openen",
    "settings.resetApp": "App resetten",
    "settings.resetAppDesc": "Verwijder alle favorieten, recente stations en voorkeuren",
    "settings.resetConfirm": "Weet je het zeker? Deze actie kan niet ongedaan worden gemaakt.",
    "settings.resetDone": "App gereset",
    "settings.resetButton": "Alles verwijderen",
    "premium.restorePurchases": "Aankopen herstellen",
    "premium.restoreSuccess": "Aankopen succesvol hersteld",
    "premium.restoreNone": "Geen aankopen om te herstellen",
    "guide.title": "Gebruikershandleiding",
    "guide.button": "Gebruikershandleiding",
    "guide.home": "Home",
    "guide.homeContent": "Het startscherm toont je recent beluisterde stations, populaire stations, snelle toegang tot favorieten, wekelijkse ontdekkingen en genre-exploratie.",
    "guide.search": "Zoeken",
    "guide.searchContent": "Zoek een station op naam, filter vervolgens op land, genre of taal. Sorteer resultaten op populariteit, alfabetische volgorde of aantal klikken.",
    "guide.favorites": "Favorieten",
    "guide.favoritesContent": "Tik op het hartpictogram van een station om het aan je favorieten toe te voegen. Vanuit de instellingen kun je je favorieten exporteren als CSV, importeren of delen.",
    "guide.settings": "Instellingen",
    "guide.settingsContent": "Wijzig de interfacetaal, activeer de slaaptimer, beheer je favorieten (exporteren/importeren/delen), bekijk de stationbron en het privacybeleid.",
    "guide.permissions": "Machtigingen",
    "guide.permissionsContent": "RadioSphere.be vraagt enkele machtigingen om volledig te werken: meldingen tonen afspeelknoppen op je vergrendelscherm; locatie is nodig om Chromecast-apparaten in de buurt te detecteren; opslagtoegang maakt het mogelijk je opnames op te slaan. Geen persoonlijke gegevens worden verzameld of verzonden.",
    "guide.permissionsContentDesktop": "In de webversie vraagt RadioSphere.be geen systeemmachtigingen: audioweergave werkt native in je browser. Er worden geen persoonlijke gegevens verzameld. Voor bediening op het vergrendelscherm, ingebouwde Chromecast en lokale opnames, installeer de gratis Android-app via Google Play.",
    "guide.permissionsContentMobile": "Op je telefoon kan RadioSphere.be (web) toestemming vragen om meldingen voor afspeelknoppen te tonen. Voor meer functies (Chromecast, lokaal opgeslagen opnames, vergrendelscherm-bediening), installeer de gratis Android-app via Google Play.",
    "guide.permissionsReRequest": "Machtigingen opnieuw aanvragen",
    "guide.permissionsReopenWelcome": "Welkomstpagina herladen",
    "guide.sleepTimer": "Slaaptimer",
    "guide.sleepTimerContent": "Plan het automatisch stoppen van het afspelen na een tijd naar keuze (15 min tot 2 uur of aangepaste duur). Ideaal om in slaap te vallen met de radio.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Neem je favoriete programma's op als MP3 rechtstreeks vanuit de volledig-schermspeler. De 5-minutenbuffer laat je ook terugspoelen en herbeluisteren wat je net hebt gemist. Druk op REC om de opname te starten (max 10 min).",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Stream je radiostations naar je TV of verbonden speaker via Chromecast. Tik op het Cast-icoon in de speler om te beginnen.",
    "welcome.subtitle": "Wereldradio binnen handbereik",
    "welcome.chooseLanguage": "Kies je taal",
    "welcome.start": "Beginnen",
    "welcome.stations": "50.000+ stations",
    "welcome.search": "Geavanceerd zoeken",
    "welcome.favExport": "Favorieten & export",
    "welcome.genres": "25 muziekgenres",
    "welcome.sleepTimer": "Slaaptimer",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Luister live terug",
    "genre.60s": "60s",
    "genre.70s": "70s",
    "genre.80s": "80s",
    "genre.90s": "90s",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Klassiek",
    "genre.country": "Country",
    "genre.electronic": "Elektronisch",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latin",
    "genre.metal": "Metal",
    "genre.news": "Nieuws",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Uitzending naar",
    "cast.controlFromPhone": "Bedien vanaf je telefoon",
    "cast.connected": "Verbonden",
    "cast.disconnected": "Ontkoppeld",
    "cast.unsupportedBrowser": "Chromecast is beschikbaar in Google Chrome of de Android-app.",
    "cast.openInChrome": "Open in Chrome om Chromecast te gebruiken",
    "player.live": "LIVE",
    "player.recording": "Opname",
    "player.recordingStarted": "Opname gestart",
    "player.recordingStopped": "Opname beëindigd",
    "player.recordingMaxReached": "Maximale duur bereikt (10 min)",
    "player.saveRecording": "Opslaan op telefoon",
    "player.shareRecording": "Opname delen",
    "player.returnToLive": "Terug naar live",
    "player.recordPremiumOnly": "Opnemen is een Premium-functie",
    "player.fileSaved": "Bestand opgeslagen!",
    "player.backInTime": "Terug in de tijd",
    "player.bufferLoading": "Buffer laden...",
    "player.recordingNotAvailable": "Opname niet beschikbaar",
    "player.recordingContinuesLive": "Terug naar live, opname loopt door...",
    "player.codec": "Codec",
    "player.bitrate": "Bitrate",
    "player.language": "Taal",
    "player.noStreamInfo": "Geen info van de stream of Radio Browser",
    "onboarding.title": "Welkom bij RadioSphere.be",
    "onboarding.free": "100% Gratis",
    "onboarding.freeDesc": "Onbeperkte toegang zonder abonnement",
    "onboarding.noAds": "Geen toegevoegde advertenties",
    "onboarding.noAdsDesc": "Geen advertenties toegevoegd door RadioSphere.be. Stations kunnen hun eigen advertenties in hun streams opnemen.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Spoel live radio terug",
    "onboarding.cta": "Binnenkort op Google Play",
    "onboarding.dismiss": "Niet meer tonen",
    "tbmQuota.title": "Onbeperkt tijdreizen?",
    "tbmQuota.description": "Op het web is de TimeBack Machine beperkt: terugspoelen tot 2 minuten en opname tot maximaal 5 minuten, met een totaal quotum van 10 min/dag op mobiel voor stabiliteit. De premium-versie op Google Play laat je tot 5 minuten terugspoelen en tot 30 minuten opnemen, zonder quotum.",
    "tbmQuota.cta": "Downloaden op Google Play",
    "tbmQuota.continueLive": "Doorgaan met live",
    "tbmQuota.warning": "Geniet van onbeperkte TimeBack Machine in onze app!",
    "home.androidTitle": "RadioSphere.be op Android",
    "home.androidDesc": "Luister overal naar je favoriete stations, met Android Auto, Chromecast en de TimeBack Machine.",
    "home.comingSoon": "Binnenkort beschikbaar",
    "notFound.message": "Oeps! Pagina niet gevonden",
    "notFound.backHome": "Terug naar home",
    "footer.poweredByPrefix": "Aangedreven door het geweldige ",
    "footer.poweredBySuffix": ". Met dank aan Alex Segler voor dit community-project.",
    "footer.createdBy": "Gemaakt door Franck Malherbe",
    "aria.play": "Afspelen",
    "aria.pause": "Pauzeren",
    "aria.addFavorite": "Toevoegen aan favorieten",
    "aria.removeFavorite": "Verwijderen uit favorieten",
    "aria.close": "Sluiten",
    "aria.refresh": "Vernieuwen"
  },
  pt: {
    "nav.home": "Início",
    "nav.search": "Pesquisar",
    "nav.explore": "Pesquisar e explorar",
    "nav.favorites": "Favoritos",
    "nav.premium": "Premium",
    "nav.settings": "Definições",
    "nav.about": "Sobre",
    "sidebar.stationCount": "Mais de 50.000 estações de rádio em mais de 230 países, grátis, sem registo, sem anúncios adicionados.",
    "sidebar.tbmTeaser": "A nossa exclusividade: a TimeBack Machine — rebobine a rádio em direto, volte a ouvir os últimos 5 minutos, grave os seus programas em MP3. O leitor de rádio online que permite voltar no tempo.",
    "sidebar.tbmHowItWorks": "Como funciona?",
    "sidebar.podcastTeaser": "Apetece-lhe um podcast?",
    "tbmModal.title": "TimeBack Machine — Como funciona?",
    "tbmModal.intro": "A TimeBack Machine é uma exclusividade da RadioSphere.be que revoluciona a audição de rádio online. Nunca mais perca um momento importante em direto!",
    "tbmModal.bufferTitle": "🔄 Buffer inteligente (5 minutos)",
    "tbmModal.bufferDesc": "Assim que ouve uma estação, a RadioSphere.be grava automaticamente os últimos 5 minutos num buffer circular. Não precisa de ativar nada: é automático e transparente.",
    "tbmModal.rewindTitle": "⏪ Rebobinar o direto",
    "tbmModal.rewindDesc": "Perdeu uma notícia, uma música ou um momento importante? Abra a TimeBack Machine e rebobine até 5 minutos. Use os botões -15s/+15s ou arraste a timeline para navegar com precisão.",
    "tbmModal.recordTitle": "🔴 Gravar em MP3",
    "tbmModal.recordDesc": "Prima REC para capturar até 10 minutos de emissão em MP3, diretamente do leitor. Perfeito para guardar entrevistas, faixas ou programas inteiros.",
    "tbmModal.iconTitle": "💡 O ícone TBM a piscar",
    "tbmModal.iconDesc": "Quando o ícone TBM pisca no leitor, significa que o buffer está ativo e a gravar continuamente. Toque nele para abrir a TimeBack Machine e aceder aos últimos minutos de audição.",
    "tbmModal.liveTitle": "📡 Voltar ao direto",
    "tbmModal.liveDesc": "A qualquer momento, prima 'EM DIRETO' para voltar instantaneamente ao streaming ao vivo da sua estação.",
    "tbmModal.close": "Entendido",
    "app.downloadTitle": "Aplicação Móvel",
    "app.downloadDesc": "Ouça as suas rádios em qualquer lugar com a app Android.",
    "app.downloadBtn": "Em breve",
    "footer.tagline": "O web player premium para ouvir milhares de estações de rádio de todo o mundo.",
    "footer.links": "Links úteis",
    "footer.contact": "Contacto",
    "footer.rights": "Todos os direitos reservados.",
    "privacy.title": "Política de Privacidade",
    "privacy.lastUpdated": "Última atualização",
    "privacy.dataCollection": "Recolha de dados",
    "privacy.dataCollectionDesc": "A RadioSphere.be não recolhe quaisquer dados pessoais identificáveis. Não é necessário registo para utilizar o serviço.",
    "privacy.localStorage": "Armazenamento local",
    "privacy.localStorageDesc": "Todos os dados são armazenados exclusivamente no seu dispositivo:",
    "privacy.localStorageFavorites": "As suas estações favoritas",
    "privacy.localStorageLang": "A sua preferência de idioma",
    "privacy.localStorageRecent": "As suas estações ouvidas recentemente",
    "privacy.localStoragePrefs": "As suas definições de interface",
    "privacy.analytics": "Medição de audiência (Umami Analytics)",
    "privacy.analyticsDesc": "Utilizamos o Umami Analytics, uma solução respeitadora da privacidade e conforme com o RGPD. O Umami não recolhe dados pessoais identificáveis, não usa cookies e todos os dados são anonimizados.",
    "privacy.analyticsNoCookies": "Sem cookies de rastreamento",
    "privacy.analyticsAnonymous": "Dados completamente anonimizados",
    "privacy.analyticsGDPR": "Conforme com o RGPD",
    "privacy.analyticsNoPersonal": "Nenhum dado pessoal identificável recolhido",
    "privacy.analyticsLearnMore": "Saiba mais sobre a privacidade do Umami",
    "privacy.thirdParty": "Serviços de terceiros",
    "privacy.thirdPartyDesc": "Os fluxos de áudio são fornecidos diretamente pelas estações de rádio através da API Radio Browser. Os fluxos podem conter publicidade inserida pelas próprias estações — a RadioSphere.be não pode filtrá-la nem bloqueá-la.",
    "privacy.thirdPartyUmami": "O Umami Analytics (cloud.umami.is) é utilizado para medir o tráfego do site de forma anónima. Sem cookies, sem dados pessoais.",
    "privacy.permissions": "Navegador web",
    "privacy.permissionsDesc": "A RadioSphere.be é um site acessível a partir de qualquer navegador moderno. Não é necessária instalação. O site não utiliza cookies de terceiros.",
    "privacy.security": "Segurança",
    "privacy.securityDesc": "Como nenhum dado pessoal é recolhido ou transmitido, não há risco de fuga de dados. Os seus favoritos e preferências nunca saem do seu dispositivo.",
    "privacy.contact": "Contacto",
    "privacy.contactDesc": "Para qualquer questão sobre esta política de privacidade, pode contactar-nos em:",
    "player.selectStation": "Selecione uma estação para começar",
    "home.greeting": "Olá 👋",
    "home.recentlyPlayed": "Ouvidas recentemente",
    "home.popularStations": "Estações populares",
    "home.localPopular": "Estações populares",
    "home.exploreByGenre": "Explorar por género",
    "home.yourFavorites": "Os seus favoritos",
    "home.weeklyDiscoveries": "Descobertas da semana",
    "home.popularNearYou": "Populares perto de si",
    "home.noFavorites": "Adicione favoritos para os encontrar aqui",
    "search.title": "Pesquisar",
    "search.placeholder": "Pesquisar uma estação...",
    "search.country": "País",
    "search.selectCountry": "Escolher um país",
    "search.clearCountry": "Limpar país",
    "search.resetFilters": "Repor filtros",
    "search.notFoundTitle": "Não encontrou a sua estação preferida?",
    "search.notFoundAddOn": "Pode adicioná-la diretamente em",
    "search.notFoundEmailUs": "Também podemos tentar adicioná-la por si: envie-nos um e-mail para",
    "inAppBrowser.warning": "Para uma melhor experiência, abra a RadioSphere.be no seu navegador habitual.",
    "inAppBrowser.openExternal": "Abrir no navegador",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Sem resultados",
    "search.networkError": "Erro de rede. Não foi possível contactar o servidor de estações.",
    "search.countriesError": "Não foi possível carregar a lista de países.",
    "search.retry": "Tentar novamente",
    "search.useFilters": "Use a pesquisa ou os filtros para encontrar estações",
    "search.genre": "Género",
    "search.language": "Idioma",
    "search.loadMore": "Mais estações",
    "search.loadingMore": "A carregar...",
    "search.sortPopularity": "Popularidade",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Cliques",
    "search.resultsCount": "estações encontradas",
    "favorites.title": "Favoritos",
    "favorites.empty": "Sem favoritos",
    "favorites.emptyDesc": "Toque no coração de uma estação para a adicionar aos favoritos",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Por país",
    "favorites.unknownCountry": "País desconhecido",
    "favorites.sortGenre": "Por género",
    "favorites.unknownGenre": "Género desconhecido",
    "favorites.viewList": "Lista",
    "favorites.viewMedium": "Miniaturas",
    "favorites.viewLarge": "Miniaturas grandes",
    "favorites.viewSmall": "Miniaturas pequenas",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "A experiência de rádio definitiva",
    "premium.active": "Premium ativo",
    "premium.sleepTimer": "Temporizador de sono",
    "premium.sleepTimerDesc": "Para automaticamente a reprodução após um tempo configurável",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Controle a RadioSphere.be diretamente a partir do Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Transmita as suas estações para a TV ou coluna conectada via Chromecast",
    "premium.recorder": "Gravador",
    "premium.recorderDesc": "Grave os seus programas em MP3 e rebobine até 5 minutos atrás",
    "premium.monthly": "Compra única — 9,99€",
    "premium.buyLifetime": "Desbloquear para sempre",
    "premium.priceNote": "Preço indicativo. O valor final pode variar consoante o país.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Restaurar compra",
    "premium.disclaimer": "Compra única, acesso vitalício. Sem subscrição.",
    "premium.comingSoon": "Em breve",
    "premium.passwordPlaceholder": "Introduza o código de acesso",
    "premium.unlock": "Desbloquear",
    "premium.lock": "Bloquear Premium",
    "premium.wrongPassword": "Código incorreto",
    "premium.unlocked": "Premium desbloqueado!",
    "sleepTimer.title": "Temporizador de sono",
    "sleepTimer.desc": "Para automaticamente a reprodução após um tempo definido",
    "sleepTimer.off": "Desativado",
    "sleepTimer.active": "Ativo",
    "sleepTimer.remaining": "Restante",
    "sleepTimer.cancel": "Cancelar temporizador",
    "sleepTimer.stopped": "A reprodução foi pausada automaticamente.",
    "sleepTimer.custom": "Personalizado",
    "sleepTimer.customPlaceholder": "Minutos",
    "sleepTimer.customGo": "Ir",
    "sleepTimer.15": "15 min",
    "sleepTimer.30": "30 min",
    "sleepTimer.45": "45 min",
    "sleepTimer.60": "1 hora",
    "sleepTimer.90": "1h30",
    "sleepTimer.120": "2 horas",
    "player.nowPlaying": "A reproduzir",
    "player.streamError": "Erro de reprodução",
    "player.streamErrorDesc": "Não foi possível reproduzir este fluxo. Tente outra estação.",
    "player.error": "Erro",
    "player.streamUnavailable": "Esta estação não tem URL de fluxo.",
    "player.visitWebsite": "Visitar site",
    "player.timeout": "Tempo esgotado",
    "player.timeoutDesc": "O fluxo não responde. Tente outra estação.",
    "player.unexpectedError": "Erro inesperado",
    "player.unexpectedErrorDesc": "Ocorreu um erro. Tente novamente.",
    "ssl.title": "Ligação não segura",
    "ssl.description": "usa uma ligação não encriptada (HTTP). Este problema provém do servidor da rádio, não da RadioSphere.be.",
    "ssl.technical": "O fluxo de áudio desta estação não cumpre os padrões atuais de encriptação SSL/TLS. A RadioSphere.be não pode garantir a segurança desta ligação.",
    "ssl.acceptRisk": "Ouvir por minha conta e risco",
    "exit.title": "Fechar a aplicação?",
    "exit.description": "Prima voltar mais uma vez para sair da RadioSphere.",
    "exit.confirm": "Sair",
    "common.cancel": "Cancelar",
    "settings.title": "Definições",
    "settings.language": "Idioma",
    "settings.languageDesc": "Escolha o idioma da interface",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Utilização de dados",
    "settings.dataWarningDesc": "Ouvir estações de rádio utiliza a sua ligação à internet e pode consumir dados móveis. Recomendamos Wi-Fi para utilização prolongada.",
    "settings.dataDisclaimer": "Dados locais",
    "settings.dataDisclaimerDesc": "Os seus favoritos e preferências são armazenados localmente no seu dispositivo. Nenhum dado pessoal é enviado para qualquer servidor.",
    "settings.radioSource": "Fonte das estações",
    "settings.radioSourceDesc": "A lista de estações é fornecida pelo Radio Browser, uma API comunitária livre e gratuita com mais de 50.000 estações de rádio em todo o mundo.",
    "settings.radioSourceLink": "Visitar Radio Browser",
    "settings.radioSourceAddStation": "Adicionar uma estação",
    "settings.analytics": "Medição de audiência",
    "settings.analyticsDesc": "A RadioSphere.be utiliza o Umami Analytics, uma solução respeitadora da privacidade e conforme com o RGPD.",
    "settings.analyticsNoCookies": "Sem cookies de rastreamento",
    "settings.analyticsAnonymous": "Dados completamente anonimizados",
    "settings.analyticsGDPR": "Conforme com o RGPD",
    "settings.analyticsUsage": "Mede apenas a utilização global (páginas visitadas, funcionalidades utilizadas)",
    "settings.analyticsLearnMore": "Saiba mais sobre o Umami",
    "favorites.manage": "Gerir favoritos",
    "favorites.export": "Exportar como CSV",
    "favorites.import": "Importar CSV",
    "favorites.share": "Partilhar os meus favoritos",
    "favorites.exported": "Favoritos exportados",
    "favorites.imported": "favoritos importados",
    "favorites.importError": "Erro de importação",
    "favorites.refreshingMetadata": "A obter metadados...",
    "favorites.metadataRefreshed": "Metadados atualizados",
    "favorites.unavailableStations": "Estações não encontradas",
    "favorites.unavailableDesc": "Estas estações já não estão listadas no Radio Browser e podem já não estar disponíveis:",
    "favorites.understood": "Entendido",
    "favorites.noFavoritesToExport": "Nenhum favorito para exportar",
    "favorites.refreshMetadata": "Atualizar metadados",
    "settings.privacyPolicy": "Política de Privacidade",
    "settings.reopenWelcome": "Reabrir página de boas-vindas",
    "settings.resetApp": "Repor aplicação",
    "settings.resetAppDesc": "Eliminar todos os favoritos, estações recentes e preferências",
    "settings.resetConfirm": "Tem a certeza? Esta ação é irreversível.",
    "settings.resetDone": "Aplicação reposta",
    "settings.resetButton": "Eliminar tudo",
    "premium.restorePurchases": "Restaurar compras",
    "premium.restoreSuccess": "Compras restauradas com sucesso",
    "premium.restoreNone": "Nenhuma compra para restaurar",
    "guide.title": "Guia do utilizador",
    "guide.button": "Guia do utilizador",
    "guide.home": "Início",
    "guide.homeContent": "O ecrã inicial mostra as estações ouvidas recentemente, estações populares, acesso rápido aos favoritos, descobertas semanais e exploração por género.",
    "guide.search": "Pesquisar",
    "guide.searchContent": "Pesquise uma estação por nome, depois filtre por país, género ou idioma. Ordene os resultados por popularidade, ordem alfabética ou número de cliques.",
    "guide.favorites": "Favoritos",
    "guide.favoritesContent": "Toque no ícone do coração numa estação para a adicionar aos favoritos. Nas definições, pode exportar os favoritos como CSV, importá-los ou partilhá-los.",
    "guide.settings": "Definições",
    "guide.settingsContent": "Altere o idioma da interface, ative o temporizador de sono, gira os seus favoritos (exportar/importar/partilhar), consulte a fonte das estações e a política de privacidade.",
    "guide.permissions": "Permissões",
    "guide.permissionsContent": "A RadioSphere.be solicita algumas permissões para funcionar plenamente: as notificações permitem controlos de reprodução no ecrã de bloqueio; a localização é necessária para detetar dispositivos Chromecast próximos; o acesso ao armazenamento permite guardar as gravações no telefone. Nenhum dado pessoal é recolhido ou enviado.",
    "guide.permissionsContentDesktop": "Na versão web, a RadioSphere.be não solicita nenhuma permissão do sistema: a reprodução áudio funciona nativamente no seu navegador. Nenhum dado pessoal é recolhido. Para usufruir dos controlos no ecrã de bloqueio, Chromecast integrado e gravação local, instale a aplicação Android gratuita no Google Play.",
    "guide.permissionsContentMobile": "No seu telefone, a RadioSphere.be (web) pode pedir permissão para mostrar notificações dos controlos de reprodução. Para mais funcionalidades (Chromecast, gravações guardadas no dispositivo, controlos no ecrã de bloqueio), instale a aplicação Android gratuita no Google Play.",
    "guide.permissionsReRequest": "Solicitar permissões novamente",
    "guide.permissionsReopenWelcome": "Recarregar página de boas-vindas",
    "guide.sleepTimer": "Temporizador de sono",
    "guide.sleepTimerContent": "Programe a paragem automática da reprodução após um tempo à sua escolha (15 min a 2 horas ou duração personalizada). Ideal para adormecer com a rádio.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Grave os seus programas favoritos em MP3 diretamente do leitor em ecrã inteiro. O buffer de 5 minutos permite também rebobinar e voltar a ouvir o que acabou de perder. Prima REC para iniciar a gravação (máx. 10 min).",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Transmita as suas estações de rádio para a TV ou coluna conectada via Chromecast. Toque no ícone Cast no leitor para começar.",
    "welcome.subtitle": "A rádio mundial ao seu alcance",
    "welcome.chooseLanguage": "Escolha o idioma",
    "welcome.start": "Começar",
    "welcome.stations": "50.000+ estações",
    "welcome.search": "Pesquisa avançada",
    "welcome.favExport": "Favoritos e exportação",
    "welcome.genres": "25 géneros musicais",
    "welcome.sleepTimer": "Temporizador de sono",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Reouve a transmissão ao vivo",
    "genre.60s": "Anos 60",
    "genre.70s": "Anos 70",
    "genre.80s": "Anos 80",
    "genre.90s": "Anos 90",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Clássica",
    "genre.country": "Country",
    "genre.electronic": "Eletrónica",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latina",
    "genre.metal": "Metal",
    "genre.news": "Notícias",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "A transmitir para",
    "cast.controlFromPhone": "Controle a partir do telefone",
    "cast.connected": "Ligado",
    "cast.disconnected": "Desligado",
    "cast.unsupportedBrowser": "O Chromecast está disponível no Google Chrome ou na aplicação Android.",
    "cast.openInChrome": "Abra no Chrome para usar o Chromecast",
    "player.live": "EM DIRETO",
    "player.recording": "A gravar",
    "player.recordingStarted": "Gravação iniciada",
    "player.recordingStopped": "Gravação terminada",
    "player.recordingMaxReached": "Duração máxima atingida (10 min)",
    "player.saveRecording": "Guardar no telefone",
    "player.shareRecording": "Partilhar gravação",
    "player.returnToLive": "Voltar ao direto",
    "player.recordPremiumOnly": "A gravação é uma funcionalidade Premium",
    "player.fileSaved": "Ficheiro guardado!",
    "player.backInTime": "Voltar no tempo",
    "player.bufferLoading": "A carregar buffer...",
    "player.recordingNotAvailable": "Gravação não disponível",
    "player.recordingContinuesLive": "A voltar ao direto, gravação em curso...",
    "player.codec": "Codec",
    "player.bitrate": "Bitrate",
    "player.language": "Idioma",
    "player.noStreamInfo": "Sem informação do fluxo ou Radio Browser",
    "onboarding.title": "Bem-vindo à RadioSphere.be",
    "onboarding.free": "100% Grátis",
    "onboarding.freeDesc": "Acesso ilimitado sem subscrição",
    "onboarding.noAds": "Zero publicidade adicionada",
    "onboarding.noAdsDesc": "Nenhuma publicidade adicionada pela RadioSphere.be. As estações podem incluir os seus próprios anúncios nos fluxos.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Rebobine a rádio em direto",
    "onboarding.cta": "Em breve no Google Play",
    "onboarding.dismiss": "Não mostrar mais",
    "tbmQuota.title": "Quer viajar no tempo sem limites?",
    "tbmQuota.description": "Na web, a TimeBack Machine é limitada: rebobinagem até 2 minutos e gravação até 5 minutos no máximo, com uma quota global de 10 min/dia em móvel para garantir a estabilidade. A versão premium disponível no Google Play permite rebobinar até 5 minutos e gravar até 30 minutos, sem quota.",
    "tbmQuota.cta": "Descarregar no Google Play",
    "tbmQuota.continueLive": "Continuar em direto",
    "tbmQuota.warning": "Desfrute da TimeBack Machine ilimitada na nossa app!",
    "home.androidTitle": "RadioSphere.be no Android",
    "home.androidDesc": "Ouça as suas estações favoritas em qualquer lugar, com Android Auto, Chromecast e a TimeBack Machine.",
    "home.comingSoon": "Em breve",
    "notFound.message": "Ops! Página não encontrada",
    "notFound.backHome": "Voltar ao início",
    "footer.poweredByPrefix": "Alimentado pelo incrível ",
    "footer.poweredBySuffix": ". Obrigado a Alex Segler por este projeto comunitário.",
    "footer.createdBy": "Criado por Franck Malherbe",
    "aria.play": "Reproduzir",
    "aria.pause": "Pausa",
    "aria.addFavorite": "Adicionar aos favoritos",
    "aria.removeFavorite": "Remover dos favoritos",
    "aria.close": "Fechar",
    "aria.refresh": "Atualizar"
  },
  pl: {
    "nav.home": "Strona główna",
    "nav.search": "Szukaj",
    "nav.explore": "Szukaj i odkrywaj",
    "nav.favorites": "Ulubione",
    "nav.premium": "Premium",
    "nav.settings": "Ustawienia",
    "nav.about": "O aplikacji",
    "sidebar.stationCount": "Ponad 50 000 stacji radiowych z ponad 230 krajów, za darmo, bez rejestracji, bez dodatkowych reklam.",
    "sidebar.tbmTeaser": "Nasza ekskluzywna funkcja: TimeBack Machine — przewiń radio na żywo, odsłuchaj ponownie ostatnie 5 minut, nagrywaj programy w MP3. Odtwarzacz radiowy online, który pozwala cofnąć się w czasie.",
    "sidebar.tbmHowItWorks": "Jak to działa?",
    "sidebar.podcastTeaser": "Masz ochotę na podcast?",
    "tbmModal.title": "TimeBack Machine — Jak to działa?",
    "tbmModal.intro": "TimeBack Machine to ekskluzywna funkcja RadioSphere.be, która rewolucjonizuje słuchanie radia online. Nigdy więcej nie przegap ważnego momentu na żywo!",
    "tbmModal.bufferTitle": "🔄 Inteligentny bufor (5 minut)",
    "tbmModal.bufferDesc": "Gdy tylko zaczniesz słuchać stacji, RadioSphere.be automatycznie nagrywa ostatnie 5 minut w buforze kołowym. Nie musisz niczego aktywować: działa automatycznie i przejrzyście.",
    "tbmModal.rewindTitle": "⏪ Przewiń na żywo",
    "tbmModal.rewindDesc": "Przegapiłeś wiadomość, piosenkę lub ważny moment? Otwórz TimeBack Machine i przewiń do 5 minut wstecz. Użyj przycisków -15s/+15s lub przeciągnij oś czasu, aby nawigować precyzyjnie.",
    "tbmModal.recordTitle": "🔴 Nagrywaj w MP3",
    "tbmModal.recordDesc": "Naciśnij REC, aby nagrać do 10 minut audycji w MP3, bezpośrednio z odtwarzacza. Idealny do zapisywania wywiadów, utworów lub całych programów.",
    "tbmModal.iconTitle": "💡 Migająca ikona TBM",
    "tbmModal.iconDesc": "Gdy ikona TBM miga w odtwarzaczu, oznacza to, że bufor jest aktywny i ciągle nagrywa. Dotknij jej, aby otworzyć TimeBack Machine i uzyskać dostęp do ostatnich minut słuchania.",
    "tbmModal.liveTitle": "📡 Powrót do transmisji na żywo",
    "tbmModal.liveDesc": "W dowolnym momencie naciśnij 'NA ŻYWO', aby natychmiast wrócić do transmisji na żywo swojej stacji.",
    "tbmModal.close": "Rozumiem",
    "app.downloadTitle": "Aplikacja mobilna",
    "app.downloadDesc": "Słuchaj swoich radi wszędzie z aplikacją na Androida.",
    "app.downloadBtn": "Wkrótce",
    "footer.tagline": "Premiumowy odtwarzacz webowy do słuchania tysięcy stacji radiowych z całego świata.",
    "footer.links": "Przydatne linki",
    "footer.contact": "Kontakt",
    "footer.rights": "Wszelkie prawa zastrzeżone.",
    "privacy.title": "Polityka prywatności",
    "privacy.lastUpdated": "Ostatnia aktualizacja",
    "privacy.dataCollection": "Zbieranie danych",
    "privacy.dataCollectionDesc": "RadioSphere.be nie zbiera żadnych danych osobowych umożliwiających identyfikację. Do korzystania z usługi nie jest wymagana rejestracja.",
    "privacy.localStorage": "Pamięć lokalna",
    "privacy.localStorageDesc": "Wszystkie dane są przechowywane wyłącznie na Twoim urządzeniu:",
    "privacy.localStorageFavorites": "Twoje ulubione stacje",
    "privacy.localStorageLang": "Twoje preferencje językowe",
    "privacy.localStorageRecent": "Twoje ostatnio słuchane stacje",
    "privacy.localStoragePrefs": "Twoje ustawienia interfejsu",
    "privacy.analytics": "Pomiar oglądalności (Umami Analytics)",
    "privacy.analyticsDesc": "Używamy Umami Analytics, rozwiązania szanującego prywatność i zgodnego z RODO. Umami nie zbiera danych osobowych, nie używa plików cookie, a wszystkie dane są zanonimizowane.",
    "privacy.analyticsNoCookies": "Brak ciasteczek śledzących",
    "privacy.analyticsAnonymous": "W pełni zanonimizowane dane",
    "privacy.analyticsGDPR": "Zgodne z RODO",
    "privacy.analyticsNoPersonal": "Brak zbieranych danych osobowych",
    "privacy.analyticsLearnMore": "Dowiedz się więcej o polityce prywatności Umami",
    "privacy.thirdParty": "Usługi firm trzecich",
    "privacy.thirdPartyDesc": "Strumienie audio są dostarczane bezpośrednio przez stacje radiowe za pośrednictwem API Radio Browser. Strumienie mogą zawierać reklamy wstawiane przez same stacje — RadioSphere.be nie może ich filtrować ani blokować.",
    "privacy.thirdPartyUmami": "Umami Analytics (cloud.umami.is) jest używany do anonimowego pomiaru ruchu na stronie. Bez ciasteczek, bez danych osobowych.",
    "privacy.permissions": "Przeglądarka internetowa",
    "privacy.permissionsDesc": "RadioSphere.be to strona internetowa dostępna z każdej nowoczesnej przeglądarki. Nie wymaga instalacji. Strona nie używa ciasteczek firm trzecich.",
    "privacy.security": "Bezpieczeństwo",
    "privacy.securityDesc": "Ponieważ żadne dane osobowe nie są zbierane ani przesyłane, nie ma ryzyka wycieku danych. Twoje ulubione i preferencje nigdy nie opuszczają Twojego urządzenia.",
    "privacy.contact": "Kontakt",
    "privacy.contactDesc": "W przypadku pytań dotyczących niniejszej polityki prywatności prosimy o kontakt:",
    "player.selectStation": "Wybierz stację, aby rozpocząć",
    "home.greeting": "Cześć 👋",
    "home.recentlyPlayed": "Ostatnio słuchane",
    "home.popularStations": "Popularne stacje",
    "home.localPopular": "Popularne stacje",
    "home.exploreByGenre": "Przeglądaj według gatunku",
    "home.yourFavorites": "Twoje ulubione",
    "home.weeklyDiscoveries": "Odkrycia tygodnia",
    "home.popularNearYou": "Popularne w pobliżu",
    "home.noFavorites": "Dodaj ulubione, aby je tu znaleźć",
    "search.title": "Szukaj",
    "search.placeholder": "Szukaj stacji...",
    "search.country": "Kraj",
    "search.selectCountry": "Wybierz kraj",
    "search.clearCountry": "Wyczyść kraj",
    "search.resetFilters": "Zresetuj filtry",
    "search.notFoundTitle": "Nie możesz znaleźć swojej ulubionej stacji?",
    "search.notFoundAddOn": "Możesz dodać ją bezpośrednio na",
    "search.notFoundEmailUs": "Możemy też spróbować dodać ją za Ciebie: napisz do nas na",
    "inAppBrowser.warning": "Aby uzyskać najlepsze wrażenia, otwórz RadioSphere.be w swojej zwykłej przeglądarce.",
    "inAppBrowser.openExternal": "Otwórz w przeglądarce",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Brak wyników",
    "search.networkError": "Błąd sieci. Nie można połączyć się z serwerem stacji.",
    "search.countriesError": "Nie można załadować listy krajów.",
    "search.retry": "Ponów",
    "search.useFilters": "Użyj wyszukiwarki lub filtrów, aby znaleźć stacje",
    "search.genre": "Gatunek",
    "search.language": "Język",
    "search.loadMore": "Więcej stacji",
    "search.loadingMore": "Ładowanie...",
    "search.sortPopularity": "Popularność",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Kliknięcia",
    "search.resultsCount": "stacji znalezionych",
    "favorites.title": "Ulubione",
    "favorites.empty": "Brak ulubionych",
    "favorites.emptyDesc": "Dotknij serca stacji, aby dodać ją do ulubionych",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Wg kraju",
    "favorites.unknownCountry": "Nieznany kraj",
    "favorites.sortGenre": "Wg gatunku",
    "favorites.unknownGenre": "Nieznany gatunek",
    "favorites.viewList": "Lista",
    "favorites.viewMedium": "Miniatury",
    "favorites.viewLarge": "Duże miniatury",
    "favorites.viewSmall": "Małe miniatury",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "Najlepsze doświadczenie radiowe",
    "premium.active": "Premium aktywny",
    "premium.sleepTimer": "Wyłącznik czasowy",
    "premium.sleepTimerDesc": "Automatycznie zatrzymuje odtwarzanie po ustawionym czasie",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Steruj RadioSphere.be bezpośrednio z Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Przesyłaj swoje stacje na telewizor lub głośnik połączony przez Chromecast",
    "premium.recorder": "Rejestrator",
    "premium.recorderDesc": "Nagrywaj swoje programy w MP3 i cofnij się do 5 minut wstecz",
    "premium.monthly": "Jednorazowy zakup — 9,99€",
    "premium.buyLifetime": "Odblokuj na zawsze",
    "premium.priceNote": "Cena orientacyjna. Kwota końcowa może się różnić w zależności od kraju.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Przywróć zakup",
    "premium.disclaimer": "Jednorazowy zakup, dożywotni dostęp. Bez subskrypcji.",
    "premium.comingSoon": "Wkrótce",
    "premium.passwordPlaceholder": "Wprowadź kod dostępu",
    "premium.unlock": "Odblokuj",
    "premium.lock": "Zablokuj Premium",
    "premium.wrongPassword": "Nieprawidłowy kod",
    "premium.unlocked": "Premium odblokowany!",
    "sleepTimer.title": "Wyłącznik czasowy",
    "sleepTimer.desc": "Automatycznie zatrzymuje odtwarzanie po określonym czasie",
    "sleepTimer.off": "Wyłączony",
    "sleepTimer.active": "Aktywny",
    "sleepTimer.remaining": "Pozostało",
    "sleepTimer.cancel": "Anuluj timer",
    "sleepTimer.stopped": "Odtwarzanie zostało automatycznie wstrzymane.",
    "sleepTimer.custom": "Niestandardowy",
    "sleepTimer.customPlaceholder": "Minuty",
    "sleepTimer.customGo": "Start",
    "sleepTimer.15": "15 min",
    "sleepTimer.30": "30 min",
    "sleepTimer.45": "45 min",
    "sleepTimer.60": "1 godzina",
    "sleepTimer.90": "1h30",
    "sleepTimer.120": "2 godziny",
    "player.nowPlaying": "Teraz odtwarzane",
    "player.streamError": "Błąd odtwarzania",
    "player.streamErrorDesc": "Nie można odtworzyć tego strumienia. Spróbuj innej stacji.",
    "player.error": "Błąd",
    "player.streamUnavailable": "Ta stacja nie ma adresu URL strumienia.",
    "player.visitWebsite": "Odwiedź stronę",
    "player.timeout": "Przekroczono czas",
    "player.timeoutDesc": "Strumień nie odpowiada. Spróbuj innej stacji.",
    "player.unexpectedError": "Nieoczekiwany błąd",
    "player.unexpectedErrorDesc": "Wystąpił błąd. Spróbuj ponownie.",
    "ssl.title": "Niezabezpieczone połączenie",
    "ssl.description": "używa nieszyfrowanego połączenia (HTTP). Ten problem pochodzi od serwera radia, nie od RadioSphere.be.",
    "ssl.technical": "Strumień audio tej stacji nie spełnia aktualnych standardów szyfrowania SSL/TLS. RadioSphere.be nie może zagwarantować bezpieczeństwa tego połączenia.",
    "ssl.acceptRisk": "Słuchaj na własne ryzyko",
    "exit.title": "Zamknąć aplikację?",
    "exit.description": "Naciśnij wstecz jeszcze raz, aby wyjść z RadioSphere.",
    "exit.confirm": "Wyjdź",
    "common.cancel": "Anuluj",
    "settings.title": "Ustawienia",
    "settings.language": "Język",
    "settings.languageDesc": "Wybierz język interfejsu",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Zużycie danych",
    "settings.dataWarningDesc": "Słuchanie stacji radiowych korzysta z połączenia internetowego i może zużywać dane mobilne. Zalecamy Wi-Fi do dłuższego słuchania.",
    "settings.dataDisclaimer": "Dane lokalne",
    "settings.dataDisclaimerDesc": "Twoje ulubione i preferencje są przechowywane lokalnie na Twoim urządzeniu. Żadne dane osobowe nie są wysyłane na żaden serwer.",
    "settings.radioSource": "Źródło stacji",
    "settings.radioSourceDesc": "Lista stacji jest dostarczana przez Radio Browser, wolną i darmową API społecznościową z ponad 50 000 stacjami radiowymi na całym świecie.",
    "settings.radioSourceLink": "Odwiedź Radio Browser",
    "settings.radioSourceAddStation": "Dodaj stację",
    "settings.analytics": "Pomiar oglądalności",
    "settings.analyticsDesc": "RadioSphere.be używa Umami Analytics, rozwiązania szanującego prywatność i zgodnego z RODO.",
    "settings.analyticsNoCookies": "Brak ciasteczek śledzących",
    "settings.analyticsAnonymous": "W pełni zanonimizowane dane",
    "settings.analyticsGDPR": "Zgodne z RODO",
    "settings.analyticsUsage": "Mierzy tylko globalne wykorzystanie (odwiedzone strony, używane funkcje)",
    "settings.analyticsLearnMore": "Dowiedz się więcej o Umami",
    "favorites.manage": "Zarządzaj ulubionymi",
    "favorites.export": "Eksportuj jako CSV",
    "favorites.import": "Importuj CSV",
    "favorites.share": "Udostępnij moje ulubione",
    "favorites.exported": "Ulubione wyeksportowane",
    "favorites.imported": "ulubionych zaimportowanych",
    "favorites.importError": "Błąd importu",
    "favorites.refreshingMetadata": "Pobieranie metadanych...",
    "favorites.metadataRefreshed": "Metadane zaktualizowane",
    "favorites.unavailableStations": "Stacje nie znalezione",
    "favorites.unavailableDesc": "Te stacje nie są już wymienione w Radio Browser i mogą być niedostępne:",
    "favorites.understood": "Rozumiem",
    "favorites.noFavoritesToExport": "Brak ulubionych do wyeksportowania",
    "favorites.refreshMetadata": "Zaktualizuj metadane",
    "settings.privacyPolicy": "Polityka prywatności",
    "settings.reopenWelcome": "Ponownie otwórz stronę powitalną",
    "settings.resetApp": "Zresetuj aplikację",
    "settings.resetAppDesc": "Usuń wszystkie ulubione, ostatnie stacje i preferencje",
    "settings.resetConfirm": "Czy na pewno? Ta czynność jest nieodwracalna.",
    "settings.resetDone": "Aplikacja zresetowana",
    "settings.resetButton": "Usuń wszystko",
    "premium.restorePurchases": "Przywróć zakupy",
    "premium.restoreSuccess": "Zakupy przywrócone pomyślnie",
    "premium.restoreNone": "Brak zakupów do przywrócenia",
    "guide.title": "Instrukcja obsługi",
    "guide.button": "Instrukcja obsługi",
    "guide.home": "Strona główna",
    "guide.homeContent": "Ekran główny pokazuje ostatnio słuchane stacje, popularne stacje, szybki dostęp do ulubionych, cotygodniowe odkrycia i przeglądanie według gatunków.",
    "guide.search": "Szukaj",
    "guide.searchContent": "Wyszukaj stację po nazwie, a następnie filtruj według kraju, gatunku lub języka. Sortuj wyniki według popularności, kolejności alfabetycznej lub liczby kliknięć.",
    "guide.favorites": "Ulubione",
    "guide.favoritesContent": "Dotknij ikony serca na stacji, aby dodać ją do ulubionych. Z ustawień możesz eksportować ulubione jako CSV, importować je lub udostępnić.",
    "guide.settings": "Ustawienia",
    "guide.settingsContent": "Zmień język interfejsu, aktywuj wyłącznik czasowy, zarządzaj ulubionymi (eksport/import/udostępnianie), sprawdź źródło stacji i politykę prywatności.",
    "guide.permissions": "Uprawnienia",
    "guide.permissionsContent": "RadioSphere.be wymaga kilku uprawnień do pełnego działania: powiadomienia umożliwiają kontrolę odtwarzania na ekranie blokady; lokalizacja jest potrzebna do wykrycia pobliskich urządzeń Chromecast; dostęp do pamięci pozwala zapisywać nagrania na telefonie. Żadne dane osobowe nie są zbierane ani wysyłane.",
    "guide.permissionsContentDesktop": "W wersji webowej RadioSphere.be nie wymaga żadnych uprawnień systemowych: odtwarzanie dźwięku działa natywnie w przeglądarce. Żadne dane osobowe nie są zbierane. Aby korzystać ze sterowania na ekranie blokady, wbudowanego Chromecasta i lokalnego nagrywania, zainstaluj bezpłatną aplikację Android z Google Play.",
    "guide.permissionsContentMobile": "Na telefonie RadioSphere.be (web) może poprosić o pozwolenie na wyświetlanie powiadomień do sterowania odtwarzaniem. Aby uzyskać więcej funkcji (Chromecast, nagrania zapisane na urządzeniu, sterowanie na ekranie blokady), zainstaluj bezpłatną aplikację Android z Google Play.",
    "guide.permissionsReRequest": "Ponownie poproś o uprawnienia",
    "guide.permissionsReopenWelcome": "Załaduj ponownie stronę powitalną",
    "guide.sleepTimer": "Wyłącznik czasowy",
    "guide.sleepTimerContent": "Zaplanuj automatyczne zatrzymanie odtwarzania po wybranym czasie (od 15 min do 2 godzin lub niestandardowy czas). Idealny do zasypiania przy radiu.",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Nagrywaj ulubione programy w MP3 bezpośrednio z odtwarzacza pełnoekranowego. 5-minutowy bufor pozwala również przewijać i ponownie odsłuchiwać to, co właśnie przegapiłeś. Naciśnij REC, aby rozpocząć nagrywanie (maks. 10 min).",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Przesyłaj stacje radiowe na telewizor lub głośnik połączony przez Chromecast. Dotknij ikony Cast w odtwarzaczu, aby rozpocząć.",
    "welcome.subtitle": "Radio światowe w zasięgu ręki",
    "welcome.chooseLanguage": "Wybierz język",
    "welcome.start": "Rozpocznij",
    "welcome.stations": "50 000+ stacji",
    "welcome.search": "Zaawansowane wyszukiwanie",
    "welcome.favExport": "Ulubione i eksport",
    "welcome.genres": "25 gatunki muzyczne",
    "welcome.sleepTimer": "Wyłącznik czasowy",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Przewijaj radio na żywo",
    "genre.60s": "Lata 60.",
    "genre.70s": "Lata 70.",
    "genre.80s": "Lata 80.",
    "genre.90s": "Lata 90.",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Klasyczna",
    "genre.country": "Country",
    "genre.electronic": "Elektroniczna",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latynoska",
    "genre.metal": "Metal",
    "genre.news": "Wiadomości",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "World",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Przesyłanie do",
    "cast.controlFromPhone": "Steruj z telefonu",
    "cast.connected": "Połączono",
    "cast.disconnected": "Rozłączono",
    "cast.unsupportedBrowser": "Chromecast jest dostępny w Google Chrome lub aplikacji Android.",
    "cast.openInChrome": "Otwórz w Chrome, aby użyć Chromecast",
    "player.live": "NA ŻYWO",
    "player.recording": "Nagrywanie",
    "player.recordingStarted": "Nagrywanie rozpoczęte",
    "player.recordingStopped": "Nagrywanie zakończone",
    "player.recordingMaxReached": "Osiągnięto maksymalny czas (10 min)",
    "player.saveRecording": "Zapisz na telefonie",
    "player.shareRecording": "Udostępnij nagranie",
    "player.returnToLive": "Powrót do transmisji na żywo",
    "player.recordPremiumOnly": "Nagrywanie to funkcja Premium",
    "player.fileSaved": "Plik zapisany!",
    "player.backInTime": "Powrót w czasie",
    "player.bufferLoading": "Ładowanie bufora...",
    "player.recordingNotAvailable": "Nagrywanie niedostępne",
    "player.recordingContinuesLive": "Powrót do transmisji na żywo, nagrywanie trwa...",
    "player.codec": "Kodek",
    "player.bitrate": "Bitrate",
    "player.language": "Język",
    "player.noStreamInfo": "Brak informacji ze strumienia lub Radio Browser",
    "onboarding.title": "Witaj w RadioSphere.be",
    "onboarding.free": "100% Za darmo",
    "onboarding.freeDesc": "Nieograniczony dostęp bez subskrypcji",
    "onboarding.noAds": "Zero dodanych reklam",
    "onboarding.noAdsDesc": "RadioSphere.be nie dodaje żadnych reklam. Stacje mogą umieszczać własne reklamy w swoich strumieniach.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Przewiń radio na żywo",
    "onboarding.cta": "Wkrótce w Google Play",
    "onboarding.dismiss": "Nie pokazuj więcej",
    "tbmQuota.title": "Chcesz podróżować w czasie bez ograniczeń?",
    "tbmQuota.description": "W przeglądarce TimeBack Machine jest ograniczona: przewijanie do 2 minut wstecz i nagrywanie do maks. 5 minut, z łącznym limitem 10 min/dzień na urządzeniach mobilnych dla stabilności. Wersja premium dostępna w Google Play pozwala przewijać do 5 minut wstecz i nagrywać do 30 minut, bez limitu.",
    "tbmQuota.cta": "Pobierz z Google Play",
    "tbmQuota.continueLive": "Kontynuuj na żywo",
    "tbmQuota.warning": "Ciesz się nieograniczoną TimeBack Machine w naszej aplikacji!",
    "home.androidTitle": "RadioSphere.be na Androida",
    "home.androidDesc": "Słuchaj ulubionych stacji wszędzie, z Android Auto, Chromecast i TimeBack Machine.",
    "home.comingSoon": "Wkrótce",
    "notFound.message": "Ups! Strona nie znaleziona",
    "notFound.backHome": "Powrót na stronę główną",
    "footer.poweredByPrefix": "Napędzany przez niesamowity ",
    "footer.poweredBySuffix": ". Podziękowania dla Alexa Seglera za ten projekt społecznościowy.",
    "footer.createdBy": "Stworzony przez Francka Malherbe",
    "aria.play": "Odtwórz",
    "aria.pause": "Pauza",
    "aria.addFavorite": "Dodaj do ulubionych",
    "aria.removeFavorite": "Usuń z ulubionych",
    "aria.close": "Zamknij",
    "aria.refresh": "Odśwież"
  },
  zh: {
    "nav.home": "首页",
    "nav.search": "搜索",
    "nav.explore": "搜索与探索",
    "nav.favorites": "收藏",
    "nav.premium": "高级版",
    "nav.settings": "设置",
    "nav.about": "关于",
    "sidebar.stationCount": "超过50,000个电台，覆盖230多个国家，免费，无需注册，无额外广告。",
    "sidebar.tbmTeaser": "我们的独家功能：TimeBack Machine — 倒带直播广播，重听最近5分钟，将节目录制为MP3。让您回到过去的在线广播播放器。",
    "sidebar.tbmHowItWorks": "如何使用？",
    "sidebar.podcastTeaser": "想听播客吗？",
    "tbmModal.title": "TimeBack Machine — 如何使用？",
    "tbmModal.intro": "TimeBack Machine是RadioSphere.be的独家功能，彻底改变了在线广播收听体验。再也不会错过重要的直播时刻！",
    "tbmModal.bufferTitle": "🔄 智能缓冲（5分钟）",
    "tbmModal.bufferDesc": "当您收听电台时，RadioSphere.be会自动在循环缓冲区中录制最近5分钟的内容。无需激活任何功能：完全自动且透明。",
    "tbmModal.rewindTitle": "⏪ 倒带直播",
    "tbmModal.rewindDesc": "错过了新闻、歌曲或重要时刻？打开TimeBack Machine，最多可倒退5分钟。使用-15s/+15s按钮或拖动时间线精确导航。",
    "tbmModal.recordTitle": "🔴 录制为MP3",
    "tbmModal.recordDesc": "按下REC，直接从播放器录制最多10分钟的广播为MP3。非常适合保存访谈、音乐或完整节目。",
    "tbmModal.iconTitle": "💡 闪烁的TBM图标",
    "tbmModal.iconDesc": "当播放器中的TBM图标闪烁时，表示缓冲区正在活动并持续录制。点击它可打开TimeBack Machine，访问最近几分钟的收听内容。",
    "tbmModal.liveTitle": "📡 返回直播",
    "tbmModal.liveDesc": "随时按下「直播」即可立即返回电台的实时流媒体。",
    "tbmModal.close": "知道了",
    "app.downloadTitle": "移动应用",
    "app.downloadDesc": "使用Android应用随时随地收听广播。",
    "app.downloadBtn": "即将推出",
    "footer.tagline": "收听全球数千个广播电台的高级网络播放器。",
    "footer.links": "实用链接",
    "footer.contact": "联系我们",
    "footer.rights": "版权所有。",
    "privacy.title": "隐私政策",
    "privacy.lastUpdated": "最后更新",
    "privacy.dataCollection": "数据收集",
    "privacy.dataCollectionDesc": "RadioSphere.be不收集任何可识别的个人数据。使用服务无需注册。",
    "privacy.localStorage": "本地存储",
    "privacy.localStorageDesc": "所有数据仅存储在您的设备上：",
    "privacy.localStorageFavorites": "您的收藏电台",
    "privacy.localStorageLang": "您的语言偏好",
    "privacy.localStorageRecent": "您最近收听的电台",
    "privacy.localStoragePrefs": "您的界面设置",
    "privacy.analytics": "受众测量（Umami Analytics）",
    "privacy.analyticsDesc": "我们使用Umami Analytics，一款尊重隐私且符合GDPR的分析解决方案。Umami不收集可识别的个人数据，不使用Cookie，所有数据均已匿名化。",
    "privacy.analyticsNoCookies": "无跟踪Cookie",
    "privacy.analyticsAnonymous": "完全匿名化的数据",
    "privacy.analyticsGDPR": "符合GDPR",
    "privacy.analyticsNoPersonal": "不收集可识别的个人数据",
    "privacy.analyticsLearnMore": "了解更多关于Umami的隐私政策",
    "privacy.thirdParty": "第三方服务",
    "privacy.thirdPartyDesc": "音频流由广播电台通过Radio Browser API直接提供。流媒体可能包含由电台自行插入的广告——RadioSphere.be无法过滤或屏蔽这些广告。",
    "privacy.thirdPartyUmami": "Umami Analytics（cloud.umami.is）用于匿名测量网站流量。无Cookie，无个人数据。",
    "privacy.permissions": "网络浏览器",
    "privacy.permissionsDesc": "RadioSphere.be是一个可从任何现代浏览器访问的网站。无需安装。该网站不使用第三方Cookie。",
    "privacy.security": "安全性",
    "privacy.securityDesc": "由于不收集或传输个人数据，因此不存在数据泄露风险。您的收藏和偏好永远不会离开您的设备。",
    "privacy.contact": "联系我们",
    "privacy.contactDesc": "如有关于本隐私政策的任何问题，请通过以下方式联系我们：",
    "player.selectStation": "选择一个电台开始收听",
    "home.greeting": "你好 👋",
    "home.recentlyPlayed": "最近收听",
    "home.popularStations": "热门电台",
    "home.localPopular": "热门电台",
    "home.exploreByGenre": "按类型探索",
    "home.yourFavorites": "你的收藏",
    "home.weeklyDiscoveries": "每周发现",
    "home.popularNearYou": "您附近的热门电台",
    "home.noFavorites": "添加收藏以在此查看",
    "search.title": "搜索",
    "search.placeholder": "搜索电台...",
    "search.country": "国家",
    "search.selectCountry": "选择国家",
    "search.clearCountry": "清除国家",
    "search.resetFilters": "重置筛选",
    "search.notFoundTitle": "找不到您喜欢的电台？",
    "search.notFoundAddOn": "您可以直接在以下网站添加：",
    "search.notFoundEmailUs": "我们也可以为您尝试添加：请发送电子邮件至",
    "inAppBrowser.warning": "为了获得更好的体验，请在您常用的浏览器中打开 RadioSphere.be。",
    "inAppBrowser.openExternal": "在浏览器中打开",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "未找到结果",
    "search.networkError": "网络错误。无法连接电台服务器。",
    "search.countriesError": "无法加载国家列表。",
    "search.retry": "重试",
    "search.useFilters": "使用搜索或筛选器查找电台",
    "search.genre": "类型",
    "search.language": "语言",
    "search.loadMore": "更多电台",
    "search.loadingMore": "加载中...",
    "search.sortPopularity": "人气",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "点击数",
    "search.resultsCount": "个电台",
    "favorites.title": "收藏",
    "favorites.empty": "暂无收藏",
    "favorites.emptyDesc": "点击电台的心形图标将其添加到收藏",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "按国家",
    "favorites.unknownCountry": "未知国家",
    "favorites.sortGenre": "按类型",
    "favorites.unknownGenre": "未知类型",
    "favorites.viewList": "列表",
    "favorites.viewMedium": "缩略图",
    "favorites.viewLarge": "大缩略图",
    "favorites.viewSmall": "小缩略图",
    "premium.title": "RadioSphere.be 高级版",
    "premium.subtitle": "终极广播体验",
    "premium.active": "高级版已激活",
    "premium.sleepTimer": "睡眠定时器",
    "premium.sleepTimerDesc": "在可配置的延迟后自动停止播放",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "直接从Android Auto控制RadioSphere.be",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "通过Chromecast将电台投射到电视或连接的扬声器",
    "premium.recorder": "录音机",
    "premium.recorderDesc": "将节目录制为MP3，最多可回退5分钟",
    "premium.monthly": "一次性购买 — 9.99€",
    "premium.buyLifetime": "永久解锁",
    "premium.priceNote": "参考价格。最终金额可能因国家而异。",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "恢复购买",
    "premium.disclaimer": "一次性购买，终身使用。无订阅。",
    "premium.comingSoon": "即将推出",
    "premium.passwordPlaceholder": "输入访问代码",
    "premium.unlock": "解锁",
    "premium.lock": "锁定高级版",
    "premium.wrongPassword": "代码错误",
    "premium.unlocked": "高级版已解锁！",
    "sleepTimer.title": "睡眠定时器",
    "sleepTimer.desc": "在设定时间后自动停止播放",
    "sleepTimer.off": "关闭",
    "sleepTimer.active": "活动",
    "sleepTimer.remaining": "剩余",
    "sleepTimer.cancel": "取消定时器",
    "sleepTimer.stopped": "播放已自动暂停。",
    "sleepTimer.custom": "自定义",
    "sleepTimer.customPlaceholder": "分钟",
    "sleepTimer.customGo": "开始",
    "sleepTimer.15": "15分钟",
    "sleepTimer.30": "30分钟",
    "sleepTimer.45": "45分钟",
    "sleepTimer.60": "1小时",
    "sleepTimer.90": "1小时30分",
    "sleepTimer.120": "2小时",
    "player.nowPlaying": "正在播放",
    "player.streamError": "播放错误",
    "player.streamErrorDesc": "无法播放此流。请尝试其他电台。",
    "player.error": "错误",
    "player.streamUnavailable": "此电台没有流媒体URL。",
    "player.visitWebsite": "访问网站",
    "player.timeout": "超时",
    "player.timeoutDesc": "流媒体无响应。请尝试其他电台。",
    "player.unexpectedError": "意外错误",
    "player.unexpectedErrorDesc": "发生错误。请重试。",
    "ssl.title": "不安全连接",
    "ssl.description": "使用未加密连接（HTTP）。此问题来自广播服务器，而非RadioSphere.be。",
    "ssl.technical": "此电台的音频流不符合当前的SSL/TLS加密标准。RadioSphere.be无法保证此连接的安全性。",
    "ssl.acceptRisk": "自行承担风险收听",
    "exit.title": "关闭应用？",
    "exit.description": "再按一次返回键退出RadioSphere。",
    "exit.confirm": "退出",
    "common.cancel": "取消",
    "settings.title": "设置",
    "settings.language": "语言",
    "settings.languageDesc": "选择界面语言",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "数据使用",
    "settings.dataWarningDesc": "收听广播电台会使用您的网络连接，可能消耗移动数据。建议使用Wi-Fi进行长时间收听。",
    "settings.dataDisclaimer": "本地数据",
    "settings.dataDisclaimerDesc": "您的收藏和偏好仅存储在您的设备上。不会将个人数据发送到任何服务器。",
    "settings.radioSource": "电台来源",
    "settings.radioSourceDesc": "电台列表由Radio Browser提供，这是一个免费的开源社区API，索引了全球超过50,000个广播电台。",
    "settings.radioSourceLink": "访问Radio Browser",
    "settings.radioSourceAddStation": "添加电台",
    "settings.analytics": "受众测量",
    "settings.analyticsDesc": "RadioSphere.be使用Umami Analytics，一款尊重隐私且符合GDPR的分析解决方案。",
    "settings.analyticsNoCookies": "无跟踪Cookie",
    "settings.analyticsAnonymous": "完全匿名化的数据",
    "settings.analyticsGDPR": "符合GDPR",
    "settings.analyticsUsage": "仅测量全局使用情况（页面浏览量、使用的功能）",
    "settings.analyticsLearnMore": "了解更多关于Umami",
    "favorites.manage": "管理收藏",
    "favorites.export": "导出为CSV",
    "favorites.import": "导入CSV",
    "favorites.share": "分享我的收藏",
    "favorites.exported": "收藏已导出",
    "favorites.imported": "个收藏已导入",
    "favorites.importError": "导入错误",
    "favorites.refreshingMetadata": "正在获取元数据...",
    "favorites.metadataRefreshed": "元数据已更新",
    "favorites.unavailableStations": "未找到电台",
    "favorites.unavailableDesc": "这些电台已不在Radio Browser中列出，可能不再可用：",
    "favorites.understood": "知道了",
    "favorites.noFavoritesToExport": "没有可导出的收藏",
    "favorites.refreshMetadata": "更新元数据",
    "settings.privacyPolicy": "隐私政策",
    "settings.reopenWelcome": "重新打开欢迎页面",
    "settings.resetApp": "重置应用",
    "settings.resetAppDesc": "删除所有收藏、最近电台和偏好设置",
    "settings.resetConfirm": "确定吗？此操作不可撤销。",
    "settings.resetDone": "应用已重置",
    "settings.resetButton": "全部删除",
    "premium.restorePurchases": "恢复购买",
    "premium.restoreSuccess": "购买恢复成功",
    "premium.restoreNone": "没有可恢复的购买",
    "guide.title": "使用指南",
    "guide.button": "使用指南",
    "guide.home": "首页",
    "guide.homeContent": "首页显示您最近收听的电台、热门电台、快速访问收藏、每周发现和按类型探索。",
    "guide.search": "搜索",
    "guide.searchContent": "按名称搜索电台，然后按国家、类型或语言筛选。按人气、字母顺序或点击数排序结果。",
    "guide.favorites": "收藏",
    "guide.favoritesContent": "点击电台的心形图标将其添加到收藏。在设置中，您可以将收藏导出为CSV、导入或分享。",
    "guide.settings": "设置",
    "guide.settingsContent": "更改界面语言，启用睡眠定时器，管理收藏（导出/导入/分享），查看电台来源和隐私政策。",
    "guide.permissions": "权限",
    "guide.permissionsContent": "RadioSphere.be需要一些权限才能完全运行：通知允许在锁屏上显示播放控制；位置用于检测附近的Chromecast设备；存储访问权限用于将录音保存到手机。不会收集或发送任何个人数据。",
    "guide.permissionsContentDesktop": "在网页版中，RadioSphere.be 不请求任何系统权限：音频播放在浏览器中原生运行。不收集任何个人数据。如需锁屏控制、内置 Chromecast 和本地录制功能，请从 Google Play 安装免费的 Android 应用。",
    "guide.permissionsContentMobile": "在您的手机上，RadioSphere.be（网页版）可能会请求显示播放控制通知的权限。如需更多功能（Chromecast、设备本地录音、锁屏控制），请从 Google Play 安装免费的 Android 应用。",
    "guide.permissionsReRequest": "重新请求权限",
    "guide.permissionsReopenWelcome": "重新加载欢迎页面",
    "guide.sleepTimer": "睡眠定时器",
    "guide.sleepTimerContent": "设置在您选择的时间后自动停止播放（15分钟到2小时或自定义时长）。非常适合伴着广播入睡。",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "直接从全屏播放器将您喜爱的节目录制为MP3。5分钟缓冲区还允许您倒带和重新收听刚刚错过的内容。按REC开始录制（最长10分钟）。",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "通过Chromecast将广播电台投射到电视或连接的扬声器。点击播放器中的Cast图标开始投射。",
    "welcome.subtitle": "全球广播触手可及",
    "welcome.chooseLanguage": "选择语言",
    "welcome.start": "开始",
    "welcome.stations": "50,000+电台",
    "welcome.search": "高级搜索",
    "welcome.favExport": "收藏与导出",
    "welcome.genres": "25种音乐类型",
    "welcome.sleepTimer": "睡眠定时器",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "回放直播电台",
    "genre.60s": "60年代",
    "genre.70s": "70年代",
    "genre.80s": "80年代",
    "genre.90s": "90年代",
    "genre.ambient": "氛围",
    "genre.blues": "布鲁斯",
    "genre.chillout": "放松",
    "genre.classical": "古典",
    "genre.country": "乡村",
    "genre.electronic": "电子",
    "genre.funk": "放克",
    "genre.hiphop": "嘻哈",
    "genre.jazz": "爵士",
    "genre.latin": "拉丁",
    "genre.metal": "金属",
    "genre.news": "新闻",
    "genre.pop": "流行",
    "genre.r&b": "R&B",
    "genre.reggae": "雷鬼",
    "genre.rock": "摇滚",
    "genre.soul": "灵魂乐",
    "genre.techno": "电音",
    "genre.trance": "迷幻",
    "genre.world": "世界音乐",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "正在投射到",
    "cast.controlFromPhone": "从手机控制",
    "cast.connected": "已连接",
    "cast.disconnected": "已断开",
    "cast.unsupportedBrowser": "Chromecast可在Google Chrome或Android应用中使用。",
    "cast.openInChrome": "在Chrome中打开以使用Chromecast",
    "player.live": "直播",
    "player.recording": "录制中",
    "player.recordingStarted": "录制已开始",
    "player.recordingStopped": "录制已完成",
    "player.recordingMaxReached": "已达到最大时长（10分钟）",
    "player.saveRecording": "保存到手机",
    "player.shareRecording": "分享录音",
    "player.returnToLive": "返回直播",
    "player.recordPremiumOnly": "录制是高级版功能",
    "player.fileSaved": "文件已保存！",
    "player.backInTime": "回到过去",
    "player.bufferLoading": "正在加载缓冲...",
    "player.recordingNotAvailable": "录制不可用",
    "player.recordingContinuesLive": "返回直播，录制继续中...",
    "player.codec": "编解码器",
    "player.bitrate": "比特率",
    "player.language": "语言",
    "player.noStreamInfo": "流或Radio Browser未提供信息",
    "onboarding.title": "欢迎来到RadioSphere.be",
    "onboarding.free": "100%免费",
    "onboarding.freeDesc": "无限制访问，无需订阅",
    "onboarding.noAds": "零附加广告",
    "onboarding.noAdsDesc": "RadioSphere.be不添加任何广告。电台可能在其流中包含自己的广告。",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "倒带直播广播",
    "onboarding.cta": "即将登陆Google Play",
    "onboarding.dismiss": "不再显示",
    "tbmQuota.title": "想要无限制地时间旅行？",
    "tbmQuota.description": "在网页版中，TimeBack Machine 有所限制：最多回放 2 分钟，录制最长 5 分钟，移动端每天总配额为 10 分钟以确保稳定性。Google Play 上提供的高级版可回放最多 5 分钟，录制最长 30 分钟，无配额限制。",
    "tbmQuota.cta": "在Google Play下载",
    "tbmQuota.continueLive": "继续直播",
    "tbmQuota.warning": "在我们的应用中享受无限制的TimeBack Machine！",
    "home.androidTitle": "RadioSphere.be Android版",
    "home.androidDesc": "随时随地收听您喜爱的电台，配备Android Auto、Chromecast和TimeBack Machine。",
    "home.comingSoon": "即将推出",
    "notFound.message": "哎呀！页面未找到",
    "notFound.backHome": "返回首页",
    "footer.poweredByPrefix": "由出色的",
    "footer.poweredBySuffix": "提供支持。感谢Alex Segler的社区项目。",
    "footer.createdBy": "由Franck Malherbe创建",
    "aria.play": "播放",
    "aria.pause": "暂停",
    "aria.addFavorite": "添加到收藏",
    "aria.removeFavorite": "从收藏中移除",
    "aria.close": "关闭",
    "aria.refresh": "刷新"
  },
  tr: {
    "nav.home": "Ana Sayfa",
    "nav.search": "Ara",
    "nav.explore": "Ara ve keşfet",
    "nav.favorites": "Favoriler",
    "nav.premium": "Premium",
    "nav.settings": "Ayarlar",
    "nav.about": "Hakkında",
    "sidebar.stationCount": "230'dan fazla ülkede 50.000'den fazla radyo istasyonu, ücretsiz, kayıt gerektirmez, ek reklam yok.",
    "sidebar.tbmTeaser": "Özel özelliğimiz: TimeBack Machine — canlı radyoyu geri sarın, son 5 dakikayı yeniden dinleyin, programlarınızı MP3 olarak kaydedin.",
    "sidebar.tbmHowItWorks": "Nasıl çalışır?",
    "sidebar.podcastTeaser": "Podcast dinlemek ister misiniz?",
    "tbmModal.title": "TimeBack Machine — Nasıl çalışır?",
    "tbmModal.intro": "TimeBack Machine, çevrimiçi radyo dinlemeyi devrimleştiren RadioSphere.be'ye özel bir özelliktir. Önemli bir canlı anı bir daha kaçırmayın!",
    "tbmModal.bufferTitle": "🔄 Akıllı tampon (5 dakika)",
    "tbmModal.bufferDesc": "Bir istasyonu dinlemeye başladığınızda, RadioSphere.be otomatik olarak son 5 dakikayı döngüsel bir tampona kaydeder. Hiçbir şeyi etkinleştirmenize gerek yok: tamamen otomatik ve sorunsuz.",
    "tbmModal.rewindTitle": "⏪ Canlı radyoyu geri sar",
    "tbmModal.rewindDesc": "Bir haberi, şarkıyı veya önemli bir anı mı kaçırdınız? TimeBack Machine'i açın ve 5 dakikaya kadar geri sarın. -15s/+15s düğmelerini kullanın veya zaman çizelgesini sürükleyin.",
    "tbmModal.recordTitle": "🔴 MP3 olarak kaydet",
    "tbmModal.recordDesc": "REC'e basarak doğrudan oynatıcıdan 10 dakikaya kadar yayını MP3 olarak kaydedin. Röportajları, şarkıları veya programları kaydetmek için ideal.",
    "tbmModal.iconTitle": "💡 Yanıp sönen TBM simgesi",
    "tbmModal.iconDesc": "Oynatıcıdaki TBM simgesi yanıp söndüğünde, tampon aktif ve sürekli kayıt yapıyor demektir. TimeBack Machine'i açmak ve son birkaç dakikanıza erişmek için dokunun.",
    "tbmModal.liveTitle": "📡 Canlıya dön",
    "tbmModal.liveDesc": "İstediğiniz zaman 'CANLI'ya basarak anında istasyonunuzun canlı yayınına dönün.",
    "tbmModal.close": "Anladım",
    "app.downloadTitle": "Mobil Uygulama",
    "app.downloadDesc": "Android uygulamasıyla radyolarınızı her yerde dinleyin.",
    "app.downloadBtn": "Yakında",
    "footer.tagline": "Dünya genelinde binlerce radyo istasyonu dinlemek için premium web oynatıcı.",
    "footer.links": "Faydalı bağlantılar",
    "footer.contact": "İletişim",
    "footer.rights": "Tüm hakları saklıdır.",
    "privacy.title": "Gizlilik Politikası",
    "privacy.lastUpdated": "Son güncelleme",
    "privacy.dataCollection": "Veri Toplama",
    "privacy.dataCollectionDesc": "RadioSphere.be kişisel olarak tanımlanabilir hiçbir veri toplamaz. Hizmeti kullanmak için kayıt gerekmez.",
    "privacy.localStorage": "Yerel Depolama",
    "privacy.localStorageDesc": "Tüm veriler yalnızca cihazınızda tarayıcı yerel depolaması aracılığıyla saklanır:",
    "privacy.localStorageFavorites": "Favori istasyonlarınız",
    "privacy.localStorageLang": "Dil tercihiniz",
    "privacy.localStorageRecent": "Son dinlediğiniz istasyonlar",
    "privacy.localStoragePrefs": "Arayüz ayarlarınız",
    "privacy.analytics": "Kitle Ölçümü (Umami Analytics)",
    "privacy.analyticsDesc": "Gizliliğe saygılı ve GDPR uyumlu bir analiz çözümü olan Umami Analytics kullanıyoruz.",
    "privacy.analyticsNoCookies": "İzleme çerezi kullanılmaz",
    "privacy.analyticsAnonymous": "Tamamen anonimleştirilmiş veriler",
    "privacy.analyticsGDPR": "GDPR uyumlu",
    "privacy.analyticsNoPersonal": "Kişisel olarak tanımlanabilir veri toplanmaz",
    "privacy.analyticsLearnMore": "Umami'nin gizlilik politikası hakkında daha fazla bilgi",
    "privacy.thirdParty": "Üçüncü Taraf Hizmetler",
    "privacy.thirdPartyDesc": "Ses akışları, topluluk API'si Radio Browser aracılığıyla doğrudan radyo istasyonları tarafından sağlanır.",
    "privacy.thirdPartyUmami": "Umami Analytics web trafiğini anonim olarak ölçmek için kullanılır.",
    "privacy.permissions": "Web Tarayıcısı",
    "privacy.permissionsDesc": "RadioSphere.be modern herhangi bir tarayıcıdan erişilebilen bir web sitesidir. Kurulum gerekmez.",
    "privacy.security": "Güvenlik",
    "privacy.securityDesc": "Hiçbir kişisel veri toplanmadığı veya iletilmediği için veri sızıntısı riski yoktur.",
    "privacy.contact": "İletişim",
    "privacy.contactDesc": "Bu gizlilik politikasıyla ilgili sorularınız için bize ulaşabilirsiniz:",
    "player.selectStation": "Dinlemeye başlamak için bir istasyon seçin",
    "home.greeting": "Merhaba 👋",
    "home.recentlyPlayed": "Son dinlenenler",
    "home.popularStations": "Popüler istasyonlar",
    "home.localPopular": "Popüler istasyonlar",
    "home.exploreByGenre": "Türe göre keşfet",
    "home.yourFavorites": "Favorileriniz",
    "home.weeklyDiscoveries": "Haftalık keşifler",
    "home.popularNearYou": "Yakınınızda popüler",
    "home.noFavorites": "Burada görmek için favorilere ekleyin",
    "search.title": "Ara",
    "search.placeholder": "İstasyon ara...",
    "search.country": "Ülke",
    "search.selectCountry": "Ülke seçin",
    "search.clearCountry": "Ülkeyi temizle",
    "search.resetFilters": "Filtreleri sıfırla",
    "search.notFoundTitle": "Favori istasyonunuzu bulamadınız mı?",
    "search.notFoundAddOn": "Doğrudan şu adresten ekleyebilirsiniz:",
    "search.notFoundEmailUs": "Sizin için eklemeyi de deneyebiliriz: bize e-posta gönderin",
    "inAppBrowser.warning": "Daha iyi bir deneyim için RadioSphere.be'yi normal tarayıcınızda açın.",
    "inAppBrowser.openExternal": "Tarayıcıda aç",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Sonuç bulunamadı",
    "search.networkError": "Ağ hatası. İstasyon sunucusuna ulaşılamıyor.",
    "search.countriesError": "Ülke listesi yüklenemiyor.",
    "search.retry": "Tekrar dene",
    "search.useFilters": "İstasyon bulmak için arama çubuğunu veya filtreleri kullanın",
    "search.genre": "Tür",
    "search.language": "Dil",
    "search.loadMore": "Daha fazla istasyon",
    "search.loadingMore": "Yükleniyor...",
    "search.sortPopularity": "Popülerlik",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Tıklamalar",
    "search.resultsCount": "istasyon bulundu",
    "favorites.title": "Favoriler",
    "favorites.empty": "Favori yok",
    "favorites.emptyDesc": "Favorilere eklemek için bir istasyondaki kalbe dokunun",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Ülkeye göre",
    "favorites.unknownCountry": "Bilinmeyen ülke",
    "favorites.sortGenre": "Türe göre",
    "favorites.unknownGenre": "Bilinmeyen tür",
    "favorites.viewList": "Liste",
    "favorites.viewMedium": "Küçük resimler",
    "favorites.viewLarge": "Büyük küçük resimler",
    "favorites.viewSmall": "Küçük simgeler",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "En üstün radyo deneyimi",
    "premium.active": "Premium aktif",
    "premium.sleepTimer": "Uyku Zamanlayıcısı",
    "premium.sleepTimerDesc": "Ayarlanabilir bir süre sonra oynatmayı otomatik olarak durdurur",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "RadioSphere.be'yi doğrudan Android Auto'dan kontrol edin",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "İstasyonlarınızı Chromecast ile TV'nize veya hoparlörünüze yayınlayın",
    "premium.recorder": "Kaydedici",
    "premium.recorderDesc": "Programlarınızı MP3 olarak kaydedin ve 5 dakikaya kadar geri sarın",
    "premium.monthly": "Tek seferlik satın alma — €9,99",
    "premium.buyLifetime": "Sonsuza kadar kilidi aç",
    "premium.priceNote": "Gösterge fiyat. Son tutar ülkeye göre değişebilir.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Satın almayı geri yükle",
    "premium.disclaimer": "Tek seferlik satın alma, ömür boyu erişim. Abonelik yok.",
    "premium.comingSoon": "Yakında",
    "premium.passwordPlaceholder": "Erişim kodunu girin",
    "premium.unlock": "Kilidi aç",
    "premium.lock": "Premium'u kilitle",
    "premium.wrongPassword": "Yanlış kod",
    "premium.unlocked": "Premium açıldı!",
    "sleepTimer.title": "Uyku Zamanlayıcısı",
    "sleepTimer.desc": "Belirli bir süre sonra oynatmayı otomatik olarak durdurur",
    "sleepTimer.off": "Kapalı",
    "sleepTimer.active": "Aktif",
    "sleepTimer.remaining": "Kalan",
    "sleepTimer.cancel": "Zamanlayıcıyı iptal et",
    "sleepTimer.stopped": "Oynatma otomatik olarak duraklatıldı.",
    "sleepTimer.custom": "Özel",
    "sleepTimer.customPlaceholder": "Dakika",
    "sleepTimer.customGo": "Başla",
    "sleepTimer.15": "15 dk",
    "sleepTimer.30": "30 dk",
    "sleepTimer.45": "45 dk",
    "sleepTimer.60": "1 saat",
    "sleepTimer.90": "1s30",
    "sleepTimer.120": "2 saat",
    "player.nowPlaying": "Şimdi çalıyor",
    "player.streamError": "Oynatma hatası",
    "player.streamErrorDesc": "Bu akış oynatılamıyor. Başka bir istasyon deneyin.",
    "player.error": "Hata",
    "player.streamUnavailable": "Bu istasyonun akış URL'si yok.",
    "player.visitWebsite": "Web sitesini ziyaret et",
    "player.timeout": "Zaman aşımı",
    "player.timeoutDesc": "Akış yanıt vermiyor. Başka bir istasyon deneyin.",
    "player.unexpectedError": "Beklenmeyen hata",
    "player.unexpectedErrorDesc": "Bir hata oluştu. Lütfen tekrar deneyin.",
    "ssl.title": "Güvensiz bağlantı",
    "ssl.description": "şifrelenmemiş bir bağlantı (HTTP) kullanıyor. Bu sorun radyo sunucusundan kaynaklanıyor.",
    "ssl.technical": "Bu istasyonun ses akışı mevcut SSL/TLS şifreleme standartlarını karşılamıyor.",
    "ssl.acceptRisk": "Riski kabul ederek dinle",
    "exit.title": "Uygulamayı kapat?",
    "exit.description": "RadioSphere'den çıkmak için bir kez daha geri basın.",
    "exit.confirm": "Çıkış",
    "common.cancel": "İptal",
    "settings.title": "Ayarlar",
    "settings.language": "Dil",
    "settings.languageDesc": "Arayüz dilini seçin",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Veri kullanımı",
    "settings.dataWarningDesc": "Radyo istasyonları dinlemek internet bağlantınızı kullanır ve mobil veri tüketebilir.",
    "settings.dataDisclaimer": "Yerel veriler",
    "settings.dataDisclaimerDesc": "Favorileriniz ve tercihleriniz cihazınızda yerel olarak saklanır.",
    "settings.radioSource": "İstasyon kaynağı",
    "settings.radioSourceDesc": "İstasyon listesi, dünya genelinde 50.000'den fazla radyo istasyonunu indeksleyen Radio Browser tarafından sağlanmaktadır.",
    "settings.radioSourceLink": "Radio Browser'ı ziyaret et",
    "settings.radioSourceAddStation": "İstasyon ekle",
    "settings.analytics": "Kitle Takibi",
    "settings.analyticsDesc": "RadioSphere.be, gizliliğe saygılı Umami Analytics kullanır.",
    "settings.analyticsNoCookies": "İzleme çerezi yok",
    "settings.analyticsAnonymous": "Tamamen anonimleştirilmiş veriler",
    "settings.analyticsGDPR": "GDPR uyumlu",
    "settings.analyticsUsage": "Yalnızca genel kullanımı ölçer",
    "settings.analyticsLearnMore": "Umami hakkında daha fazla bilgi",
    "favorites.manage": "Favorileri yönet",
    "favorites.export": "CSV olarak dışa aktar",
    "favorites.import": "CSV içe aktar",
    "favorites.share": "Favorilerimi paylaş",
    "favorites.exported": "Favoriler dışa aktarıldı",
    "favorites.imported": "favori içe aktarıldı",
    "favorites.importError": "İçe aktarma hatası",
    "favorites.refreshingMetadata": "Meta veriler alınıyor...",
    "favorites.metadataRefreshed": "Meta veriler güncellendi",
    "favorites.unavailableStations": "İstasyonlar bulunamadı",
    "favorites.unavailableDesc": "Bu istasyonlar artık Radio Browser'da listelenmiyor:",
    "favorites.understood": "Anladım",
    "favorites.noFavoritesToExport": "Dışa aktarılacak favori yok",
    "favorites.refreshMetadata": "Meta verileri yenile",
    "settings.privacyPolicy": "Gizlilik Politikası",
    "settings.reopenWelcome": "Hoş geldiniz sayfasını yeniden aç",
    "settings.resetApp": "Uygulamayı sıfırla",
    "settings.resetAppDesc": "Tüm favorileri, son istasyonları ve tercihleri sil",
    "settings.resetConfirm": "Emin misiniz? Bu işlem geri alınamaz.",
    "settings.resetDone": "Uygulama sıfırlandı",
    "settings.resetButton": "Her şeyi sil",
    "premium.restorePurchases": "Satın almaları geri yükle",
    "premium.restoreSuccess": "Satın almalar başarıyla geri yüklendi",
    "premium.restoreNone": "Geri yüklenecek satın alma yok",
    "guide.title": "Kullanım Kılavuzu",
    "guide.button": "Kullanım Kılavuzu",
    "guide.home": "Ana Sayfa",
    "guide.homeContent": "Ana ekran son dinlediğiniz istasyonları, popüler istasyonları, favorilere hızlı erişimi, haftalık keşifleri ve türe göre keşfi gösterir.",
    "guide.search": "Ara",
    "guide.searchContent": "Bir istasyonu ada göre arayın, ardından ülke, tür veya dile göre filtreleyin.",
    "guide.favorites": "Favoriler",
    "guide.favoritesContent": "Favorilere eklemek için bir istasyondaki kalp simgesine dokunun.",
    "guide.settings": "Ayarlar",
    "guide.settingsContent": "Arayüz dilini değiştirin, uyku zamanlayıcısını etkinleştirin, favorilerinizi yönetin.",
    "guide.permissions": "İzinler",
    "guide.permissionsContent": "RadioSphere.be tam olarak çalışmak için birkaç izin ister: bildirimler, konum ve depolama.",
    "guide.permissionsContentDesktop": "Web sürümünde RadioSphere.be hiçbir sistem izni istemez: ses çalma tarayıcınızda yerel olarak çalışır. Hiçbir kişisel veri toplanmaz. Kilit ekranı kontrolleri, dahili Chromecast ve yerel kayıt için Google Play'den ücretsiz Android uygulamasını yükleyin.",
    "guide.permissionsContentMobile": "Telefonunuzda RadioSphere.be (web), oynatma kontrolleri için bildirim gösterme izni isteyebilir. Daha fazla özellik (Chromecast, cihazda saklanan kayıtlar, kilit ekranı kontrolleri) için Google Play'den ücretsiz Android uygulamasını yükleyin.",
    "guide.permissionsReRequest": "İzinleri yeniden iste",
    "guide.permissionsReopenWelcome": "Hoş geldiniz sayfasını yeniden yükle",
    "guide.sleepTimer": "Uyku Zamanlayıcısı",
    "guide.sleepTimerContent": "Seçtiğiniz bir süre sonra otomatik oynatma durdurma programlayın (15 dk - 2 saat).",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Tam ekran oynatıcıdan favori programlarınızı doğrudan MP3 olarak kaydedin.",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Chromecast ile radyo istasyonlarınızı TV'nize veya hoparlörünüze yayınlayın.",
    "welcome.subtitle": "Parmaklarınızın ucunda dünya radyosu",
    "welcome.chooseLanguage": "Dil seçin",
    "welcome.start": "Başla",
    "welcome.stations": "50.000+ istasyon",
    "welcome.search": "Gelişmiş arama",
    "welcome.favExport": "Favoriler ve dışa aktarma",
    "welcome.genres": "25 müzik türü",
    "welcome.sleepTimer": "Uyku zamanlayıcısı",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Canlı yayını geri sar",
    "genre.60s": "60'lar",
    "genre.70s": "70'ler",
    "genre.80s": "80'ler",
    "genre.90s": "90'lar",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Klasik",
    "genre.country": "Country",
    "genre.electronic": "Elektronik",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latin",
    "genre.metal": "Metal",
    "genre.news": "Haberler",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "Dünya",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Yayınlanıyor",
    "cast.controlFromPhone": "Telefonunuzdan kontrol edin",
    "cast.connected": "Bağlandı",
    "cast.disconnected": "Bağlantı kesildi",
    "cast.unsupportedBrowser": "Chromecast Google Chrome veya Android uygulamasında kullanılabilir.",
    "cast.openInChrome": "Chromecast kullanmak için Chrome'da açın",
    "player.live": "CANLI",
    "player.recording": "Kayıt",
    "player.recordingStarted": "Kayıt başladı",
    "player.recordingStopped": "Kayıt tamamlandı",
    "player.recordingMaxReached": "Maksimum süreye ulaşıldı (10 dk)",
    "player.saveRecording": "Telefona kaydet",
    "player.shareRecording": "Kaydı paylaş",
    "player.returnToLive": "Canlıya dön",
    "player.recordPremiumOnly": "Kayıt bir Premium özelliğidir",
    "player.fileSaved": "Dosya kaydedildi!",
    "player.backInTime": "Zamanda Geri",
    "player.bufferLoading": "Tampon yükleniyor...",
    "player.recordingNotAvailable": "Kayıt kullanılamıyor",
    "player.recordingContinuesLive": "Canlıya dönüldü, kayıt devam ediyor...",
    "player.codec": "Codec",
    "player.bitrate": "Bit hızı",
    "player.language": "Dil",
    "player.noStreamInfo": "Akış veya Radio Browser tarafından sağlanan bilgi yok",
    "onboarding.title": "RadioSphere.be'ye hoş geldiniz",
    "onboarding.free": "%100 Ücretsiz",
    "onboarding.freeDesc": "Abonelik olmadan sınırsız erişim",
    "onboarding.noAds": "Sıfır Eklenen Reklam",
    "onboarding.noAdsDesc": "RadioSphere.be tarafından eklenen reklam yok.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Canlı radyoyu istediğiniz zaman geri sarın",
    "onboarding.cta": "Yakında Google Play'de",
    "onboarding.dismiss": "Bir daha gösterme",
    "tbmQuota.title": "Sınırsız zaman yolculuğu ister misiniz?",
    "tbmQuota.description": "Web'de TimeBack Machine sınırlıdır: 2 dakikaya kadar geri sarma ve en fazla 5 dakika kayıt, mobilde kararlılık için günlük toplam 10 dk kotası. Google Play'de bulunan premium sürüm, kotasız olarak 5 dakikaya kadar geri sarma ve 30 dakikaya kadar kayıt imkânı sunar.",
    "tbmQuota.cta": "Google Play'den indirin",
    "tbmQuota.continueLive": "Canlı devam et",
    "tbmQuota.warning": "Uygulamamızda sınırsız TimeBack Machine'in keyfini çıkarın!",
    "home.androidTitle": "Android'de RadioSphere.be",
    "home.androidDesc": "Android Auto, Chromecast ve TimeBack Machine ile favori istasyonlarınızı her yerde dinleyin.",
    "home.comingSoon": "Yakında",
    "notFound.message": "Hata! Sayfa bulunamadı",
    "notFound.backHome": "Ana Sayfaya Dön",
    "footer.poweredByPrefix": "Harika ",
    "footer.poweredBySuffix": " tarafından desteklenmektedir. Alex Segler'e bu topluluk projesi için teşekkürler.",
    "footer.createdBy": "Franck Malherbe tarafından oluşturuldu",
    "aria.play": "Oynat",
    "aria.pause": "Duraklat",
    "aria.addFavorite": "Favorilere ekle",
    "aria.removeFavorite": "Favorilerden kaldır",
    "aria.close": "Kapat",
    "aria.refresh": "Yenile"
  },
  ru: {
    "nav.home": "Главная",
    "nav.search": "Поиск",
    "nav.explore": "Поиск и обзор",
    "nav.favorites": "Избранное",
    "nav.premium": "Премиум",
    "nav.settings": "Настройки",
    "nav.about": "О нас",
    "sidebar.stationCount": "Более 50 000 радиостанций в 230+ странах, бесплатно, без регистрации, без добавленной рекламы.",
    "sidebar.tbmTeaser": "Наша эксклюзивная функция: TimeBack Machine — перемотайте прямой эфир, переслушайте последние 5 минут, записывайте передачи в MP3.",
    "sidebar.tbmHowItWorks": "Как это работает?",
    "sidebar.podcastTeaser": "Хотите подкаст?",
    "tbmModal.title": "TimeBack Machine — Как это работает?",
    "tbmModal.intro": "TimeBack Machine — эксклюзивная функция RadioSphere.be, которая революционизирует онлайн-радио. Больше не пропустите важный момент в прямом эфире!",
    "tbmModal.bufferTitle": "🔄 Умный буфер (5 минут)",
    "tbmModal.bufferDesc": "Когда вы слушаете станцию, RadioSphere.be автоматически записывает последние 5 минут в циклический буфер. Ничего не нужно активировать: всё автоматически.",
    "tbmModal.rewindTitle": "⏪ Перемотка прямого эфира",
    "tbmModal.rewindDesc": "Пропустили новость, песню или важный момент? Откройте TimeBack Machine и перемотайте до 5 минут назад.",
    "tbmModal.recordTitle": "🔴 Запись в MP3",
    "tbmModal.recordDesc": "Нажмите REC, чтобы записать до 10 минут эфира в формате MP3 прямо из плеера.",
    "tbmModal.iconTitle": "💡 Мигающий значок TBM",
    "tbmModal.iconDesc": "Когда значок TBM мигает в плеере, это означает, что буфер активен и ведёт запись. Нажмите на него, чтобы открыть TimeBack Machine.",
    "tbmModal.liveTitle": "📡 Вернуться в эфир",
    "tbmModal.liveDesc": "В любой момент нажмите «ЭФИР», чтобы мгновенно вернуться к прямой трансляции.",
    "tbmModal.close": "Понятно",
    "app.downloadTitle": "Мобильное приложение",
    "app.downloadDesc": "Слушайте радио везде с приложением для Android.",
    "app.downloadBtn": "Скоро",
    "footer.tagline": "Премиум веб-плеер для прослушивания тысяч радиостанций по всему миру.",
    "footer.links": "Полезные ссылки",
    "footer.contact": "Контакты",
    "footer.rights": "Все права защищены.",
    "privacy.title": "Политика конфиденциальности",
    "privacy.lastUpdated": "Последнее обновление",
    "privacy.dataCollection": "Сбор данных",
    "privacy.dataCollectionDesc": "RadioSphere.be не собирает персональные данные. Регистрация не требуется.",
    "privacy.localStorage": "Локальное хранилище",
    "privacy.localStorageDesc": "Все данные хранятся исключительно на вашем устройстве:",
    "privacy.localStorageFavorites": "Ваши избранные станции",
    "privacy.localStorageLang": "Ваш выбор языка",
    "privacy.localStorageRecent": "Недавно прослушанные станции",
    "privacy.localStoragePrefs": "Настройки интерфейса",
    "privacy.analytics": "Аналитика (Umami Analytics)",
    "privacy.analyticsDesc": "Мы используем Umami Analytics — решение для аналитики, уважающее конфиденциальность и соответствующее GDPR.",
    "privacy.analyticsNoCookies": "Без отслеживающих cookies",
    "privacy.analyticsAnonymous": "Полностью анонимные данные",
    "privacy.analyticsGDPR": "Соответствует GDPR",
    "privacy.analyticsNoPersonal": "Персональные данные не собираются",
    "privacy.analyticsLearnMore": "Подробнее о политике конфиденциальности Umami",
    "privacy.thirdParty": "Сторонние сервисы",
    "privacy.thirdPartyDesc": "Аудиопотоки предоставляются радиостанциями через API Radio Browser.",
    "privacy.thirdPartyUmami": "Umami Analytics используется для анонимного измерения трафика.",
    "privacy.permissions": "Веб-браузер",
    "privacy.permissionsDesc": "RadioSphere.be — веб-сайт, доступный из любого современного браузера. Установка не требуется.",
    "privacy.security": "Безопасность",
    "privacy.securityDesc": "Поскольку персональные данные не собираются и не передаются, риск утечки данных отсутствует.",
    "privacy.contact": "Контакты",
    "privacy.contactDesc": "По вопросам о политике конфиденциальности свяжитесь с нами:",
    "player.selectStation": "Выберите станцию, чтобы начать слушать",
    "home.greeting": "Привет 👋",
    "home.recentlyPlayed": "Недавно слушали",
    "home.popularStations": "Популярные станции",
    "home.localPopular": "Популярные станции",
    "home.exploreByGenre": "Исследовать по жанру",
    "home.yourFavorites": "Ваше избранное",
    "home.weeklyDiscoveries": "Открытия недели",
    "home.popularNearYou": "Популярное рядом с вами",
    "home.noFavorites": "Добавьте избранное, чтобы увидеть его здесь",
    "search.title": "Поиск",
    "search.placeholder": "Поиск станции...",
    "search.country": "Страна",
    "search.selectCountry": "Выберите страну",
    "search.clearCountry": "Очистить страну",
    "search.resetFilters": "Сбросить фильтры",
    "search.notFoundTitle": "Не нашли любимую радиостанцию?",
    "search.notFoundAddOn": "Вы можете добавить её напрямую на",
    "search.notFoundEmailUs": "Мы также можем попробовать добавить её за вас: напишите нам на",
    "inAppBrowser.warning": "Для лучшего опыта откройте RadioSphere.be в вашем обычном браузере.",
    "inAppBrowser.openExternal": "Открыть в браузере",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Результатов не найдено",
    "search.networkError": "Ошибка сети. Не удаётся связаться с сервером станций.",
    "search.countriesError": "Не удалось загрузить список стран.",
    "search.retry": "Повторить",
    "search.useFilters": "Используйте поиск или фильтры для поиска станций",
    "search.genre": "Жанр",
    "search.language": "Язык",
    "search.loadMore": "Ещё станции",
    "search.loadingMore": "Загрузка...",
    "search.sortPopularity": "Популярность",
    "search.sortAZ": "А-Я",
    "search.sortClicks": "Клики",
    "search.resultsCount": "станций найдено",
    "favorites.title": "Избранное",
    "favorites.empty": "Нет избранного",
    "favorites.emptyDesc": "Нажмите на сердечко станции, чтобы добавить в избранное",
    "favorites.sortName": "А-Я",
    "favorites.sortCountry": "По стране",
    "favorites.unknownCountry": "Неизвестная страна",
    "favorites.sortGenre": "По жанру",
    "favorites.unknownGenre": "Неизвестный жанр",
    "favorites.viewList": "Список",
    "favorites.viewMedium": "Миниатюры",
    "favorites.viewLarge": "Крупные миниатюры",
    "favorites.viewSmall": "Мелкие миниатюры",
    "premium.title": "RadioSphere.be Премиум",
    "premium.subtitle": "Лучший опыт радио",
    "premium.active": "Премиум активен",
    "premium.sleepTimer": "Таймер сна",
    "premium.sleepTimerDesc": "Автоматически останавливает воспроизведение через заданное время",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Управляйте RadioSphere.be прямо из Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Транслируйте станции на ТВ или колонку через Chromecast",
    "premium.recorder": "Запись",
    "premium.recorderDesc": "Записывайте передачи в MP3 и перематывайте до 5 минут назад",
    "premium.monthly": "Разовая покупка — €9,99",
    "premium.buyLifetime": "Разблокировать навсегда",
    "premium.priceNote": "Ориентировочная цена. Итоговая сумма может отличаться в зависимости от страны.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Восстановить покупку",
    "premium.disclaimer": "Разовая покупка, пожизненный доступ. Без подписки.",
    "premium.comingSoon": "Скоро",
    "premium.passwordPlaceholder": "Введите код доступа",
    "premium.unlock": "Разблокировать",
    "premium.lock": "Заблокировать Премиум",
    "premium.wrongPassword": "Неверный код",
    "premium.unlocked": "Премиум разблокирован!",
    "sleepTimer.title": "Таймер сна",
    "sleepTimer.desc": "Автоматически останавливает воспроизведение через заданное время",
    "sleepTimer.off": "Выкл",
    "sleepTimer.active": "Активен",
    "sleepTimer.remaining": "Осталось",
    "sleepTimer.cancel": "Отменить таймер",
    "sleepTimer.stopped": "Воспроизведение автоматически приостановлено.",
    "sleepTimer.custom": "Произвольно",
    "sleepTimer.customPlaceholder": "Минуты",
    "sleepTimer.customGo": "Старт",
    "sleepTimer.15": "15 мин",
    "sleepTimer.30": "30 мин",
    "sleepTimer.45": "45 мин",
    "sleepTimer.60": "1 час",
    "sleepTimer.90": "1ч30",
    "sleepTimer.120": "2 часа",
    "player.nowPlaying": "Сейчас играет",
    "player.streamError": "Ошибка воспроизведения",
    "player.streamErrorDesc": "Не удаётся воспроизвести этот поток. Попробуйте другую станцию.",
    "player.error": "Ошибка",
    "player.streamUnavailable": "У этой станции нет URL потока.",
    "player.visitWebsite": "Посетить сайт",
    "player.timeout": "Тайм-аут",
    "player.timeoutDesc": "Поток не отвечает. Попробуйте другую станцию.",
    "player.unexpectedError": "Непредвиденная ошибка",
    "player.unexpectedErrorDesc": "Произошла ошибка. Попробуйте ещё раз.",
    "ssl.title": "Небезопасное соединение",
    "ssl.description": "использует незашифрованное соединение (HTTP). Проблема на стороне сервера радиостанции.",
    "ssl.technical": "Аудиопоток этой станции не соответствует текущим стандартам шифрования SSL/TLS.",
    "ssl.acceptRisk": "Слушать на свой риск",
    "exit.title": "Закрыть приложение?",
    "exit.description": "Нажмите ещё раз, чтобы выйти из RadioSphere.",
    "exit.confirm": "Выход",
    "common.cancel": "Отмена",
    "settings.title": "Настройки",
    "settings.language": "Язык",
    "settings.languageDesc": "Выберите язык интерфейса",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Использование данных",
    "settings.dataWarningDesc": "Прослушивание радиостанций использует интернет-соединение и может потреблять мобильные данные.",
    "settings.dataDisclaimer": "Локальные данные",
    "settings.dataDisclaimerDesc": "Ваши избранное и настройки хранятся локально на вашем устройстве.",
    "settings.radioSource": "Источник станций",
    "settings.radioSourceDesc": "Список станций предоставлен Radio Browser — бесплатным API с более чем 50 000 радиостанций.",
    "settings.radioSourceLink": "Посетить Radio Browser",
    "settings.radioSourceAddStation": "Добавить станцию",
    "settings.analytics": "Аналитика",
    "settings.analyticsDesc": "RadioSphere.be использует Umami Analytics — решение, уважающее конфиденциальность.",
    "settings.analyticsNoCookies": "Без отслеживающих cookies",
    "settings.analyticsAnonymous": "Полностью анонимные данные",
    "settings.analyticsGDPR": "Соответствует GDPR",
    "settings.analyticsUsage": "Измеряет только общее использование",
    "settings.analyticsLearnMore": "Подробнее об Umami",
    "favorites.manage": "Управление избранным",
    "favorites.export": "Экспорт в CSV",
    "favorites.import": "Импорт CSV",
    "favorites.share": "Поделиться избранным",
    "favorites.exported": "Избранное экспортировано",
    "favorites.imported": "избранных импортировано",
    "favorites.importError": "Ошибка импорта",
    "favorites.refreshingMetadata": "Получение метаданных...",
    "favorites.metadataRefreshed": "Метаданные обновлены",
    "favorites.unavailableStations": "Станции не найдены",
    "favorites.unavailableDesc": "Эти станции больше не представлены в Radio Browser:",
    "favorites.understood": "Понятно",
    "favorites.noFavoritesToExport": "Нет избранного для экспорта",
    "favorites.refreshMetadata": "Обновить метаданные",
    "settings.privacyPolicy": "Политика конфиденциальности",
    "settings.reopenWelcome": "Открыть приветственную страницу",
    "settings.resetApp": "Сбросить приложение",
    "settings.resetAppDesc": "Удалить все избранное, недавние станции и настройки",
    "settings.resetConfirm": "Вы уверены? Это действие необратимо.",
    "settings.resetDone": "Приложение сброшено",
    "settings.resetButton": "Удалить всё",
    "premium.restorePurchases": "Восстановить покупки",
    "premium.restoreSuccess": "Покупки успешно восстановлены",
    "premium.restoreNone": "Нет покупок для восстановления",
    "guide.title": "Руководство",
    "guide.button": "Руководство",
    "guide.home": "Главная",
    "guide.homeContent": "На главном экране отображаются недавно прослушанные станции, популярные станции, избранное и жанры.",
    "guide.search": "Поиск",
    "guide.searchContent": "Ищите станцию по названию, фильтруйте по стране, жанру или языку.",
    "guide.favorites": "Избранное",
    "guide.favoritesContent": "Нажмите на сердечко станции, чтобы добавить в избранное.",
    "guide.settings": "Настройки",
    "guide.settingsContent": "Измените язык интерфейса, включите таймер сна, управляйте избранным.",
    "guide.permissions": "Разрешения",
    "guide.permissionsContent": "RadioSphere.be запрашивает несколько разрешений: уведомления, местоположение и хранилище.",
    "guide.permissionsContentDesktop": "В веб-версии RadioSphere.be не запрашивает никаких системных разрешений: воспроизведение аудио работает в браузере. Личные данные не собираются. Для управления на экране блокировки, встроенного Chromecast и локальной записи установите бесплатное Android-приложение из Google Play.",
    "guide.permissionsContentMobile": "На телефоне RadioSphere.be (веб) может запросить разрешение показывать уведомления для управления воспроизведением. Для большего функционала (Chromecast, записи на устройстве, управление с экрана блокировки) установите бесплатное Android-приложение из Google Play.",
    "guide.permissionsReRequest": "Запросить разрешения повторно",
    "guide.permissionsReopenWelcome": "Перезагрузить приветственную страницу",
    "guide.sleepTimer": "Таймер сна",
    "guide.sleepTimerContent": "Запланируйте автоматическую остановку воспроизведения (от 15 мин до 2 часов).",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Записывайте передачи в MP3 прямо из полноэкранного плеера.",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Транслируйте станции на ТВ или колонку через Chromecast.",
    "welcome.subtitle": "Мировое радио у вас под рукой",
    "welcome.chooseLanguage": "Выберите язык",
    "welcome.start": "Начать",
    "welcome.stations": "50 000+ станций",
    "welcome.search": "Расширенный поиск",
    "welcome.favExport": "Избранное и экспорт",
    "welcome.genres": "25 музыкальных жанра",
    "welcome.sleepTimer": "Таймер сна",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Перемотай прямой эфир",
    "genre.60s": "60-е",
    "genre.70s": "70-е",
    "genre.80s": "80-е",
    "genre.90s": "90-е",
    "genre.ambient": "Эмбиент",
    "genre.blues": "Блюз",
    "genre.chillout": "Чилаут",
    "genre.classical": "Классика",
    "genre.country": "Кантри",
    "genre.electronic": "Электроника",
    "genre.funk": "Фанк",
    "genre.hiphop": "Хип-хоп",
    "genre.jazz": "Джаз",
    "genre.latin": "Латино",
    "genre.metal": "Метал",
    "genre.news": "Новости",
    "genre.pop": "Поп",
    "genre.r&b": "R&B",
    "genre.reggae": "Регги",
    "genre.rock": "Рок",
    "genre.soul": "Соул",
    "genre.techno": "Техно",
    "genre.trance": "Транс",
    "genre.world": "Мир",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Трансляция на",
    "cast.controlFromPhone": "Управляйте с телефона",
    "cast.connected": "Подключено",
    "cast.disconnected": "Отключено",
    "cast.unsupportedBrowser": "Chromecast доступен в Google Chrome или приложении Android.",
    "cast.openInChrome": "Откройте в Chrome для использования Chromecast",
    "player.live": "ЭФИР",
    "player.recording": "Запись",
    "player.recordingStarted": "Запись начата",
    "player.recordingStopped": "Запись завершена",
    "player.recordingMaxReached": "Достигнута максимальная длительность (10 мин)",
    "player.saveRecording": "Сохранить на телефон",
    "player.shareRecording": "Поделиться записью",
    "player.returnToLive": "Вернуться в эфир",
    "player.recordPremiumOnly": "Запись — функция Премиум",
    "player.fileSaved": "Файл сохранён!",
    "player.backInTime": "Назад во времени",
    "player.bufferLoading": "Загрузка буфера...",
    "player.recordingNotAvailable": "Запись недоступна",
    "player.recordingContinuesLive": "Возврат в эфир, запись продолжается...",
    "player.codec": "Кодек",
    "player.bitrate": "Битрейт",
    "player.language": "Язык",
    "player.noStreamInfo": "Нет информации от потока или Radio Browser",
    "onboarding.title": "Добро пожаловать в RadioSphere.be",
    "onboarding.free": "100% Бесплатно",
    "onboarding.freeDesc": "Неограниченный доступ без подписки",
    "onboarding.noAds": "Без добавленной рекламы",
    "onboarding.noAdsDesc": "RadioSphere.be не добавляет рекламу.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Перематывайте прямой эфир в любое время",
    "onboarding.cta": "Скоро в Google Play",
    "onboarding.dismiss": "Больше не показывать",
    "tbmQuota.title": "Хотите безлимитное путешествие во времени?",
    "tbmQuota.description": "В веб-версии TimeBack Machine имеет ограничения: перемотка назад до 2 минут и запись до 5 минут максимум, общая квота 10 мин/день на мобильных устройствах для стабильности. Премиум-версия в Google Play позволяет перематывать до 5 минут назад и записывать до 30 минут без квоты.",
    "tbmQuota.cta": "Скачать в Google Play",
    "tbmQuota.continueLive": "Продолжить в эфире",
    "tbmQuota.warning": "Наслаждайтесь безлимитной TimeBack Machine в нашем приложении!",
    "home.androidTitle": "RadioSphere.be на Android",
    "home.androidDesc": "Слушайте любимые станции везде с Android Auto, Chromecast и TimeBack Machine.",
    "home.comingSoon": "Скоро",
    "notFound.message": "Ой! Страница не найдена",
    "notFound.backHome": "Вернуться на главную",
    "footer.poweredByPrefix": "Работает на основе ",
    "footer.poweredBySuffix": ". Спасибо Алексу Сеглеру за этот общественный проект.",
    "footer.createdBy": "Создано Franck Malherbe",
    "aria.play": "Воспроизвести",
    "aria.pause": "Пауза",
    "aria.addFavorite": "Добавить в избранное",
    "aria.removeFavorite": "Удалить из избранного",
    "aria.close": "Закрыть",
    "aria.refresh": "Обновить"
  },
  id: {
    "nav.home": "Beranda",
    "nav.search": "Cari",
    "nav.explore": "Cari dan jelajahi",
    "nav.favorites": "Favorit",
    "nav.premium": "Premium",
    "nav.settings": "Pengaturan",
    "nav.about": "Tentang",
    "sidebar.stationCount": "Lebih dari 50.000 stasiun radio di 230+ negara, gratis, tanpa pendaftaran, tanpa iklan tambahan.",
    "sidebar.tbmTeaser": "Fitur eksklusif kami: TimeBack Machine — putar ulang radio langsung, dengarkan kembali 5 menit terakhir, rekam acara Anda dalam MP3.",
    "sidebar.tbmHowItWorks": "Bagaimana cara kerjanya?",
    "sidebar.podcastTeaser": "Ingin mendengarkan podcast?",
    "tbmModal.title": "TimeBack Machine — Bagaimana cara kerjanya?",
    "tbmModal.intro": "TimeBack Machine adalah fitur eksklusif RadioSphere.be yang merevolusi mendengarkan radio online. Jangan pernah melewatkan momen penting lagi!",
    "tbmModal.bufferTitle": "🔄 Buffer pintar (5 menit)",
    "tbmModal.bufferDesc": "Saat Anda mendengarkan stasiun, RadioSphere.be secara otomatis merekam 5 menit terakhir dalam buffer sirkular. Tidak perlu mengaktifkan apa pun: sepenuhnya otomatis.",
    "tbmModal.rewindTitle": "⏪ Putar ulang radio langsung",
    "tbmModal.rewindDesc": "Melewatkan berita, lagu, atau momen penting? Buka TimeBack Machine dan putar ulang hingga 5 menit.",
    "tbmModal.recordTitle": "🔴 Rekam sebagai MP3",
    "tbmModal.recordDesc": "Tekan REC untuk merekam hingga 10 menit siaran sebagai MP3 langsung dari pemutar.",
    "tbmModal.iconTitle": "💡 Ikon TBM berkedip",
    "tbmModal.iconDesc": "Ketika ikon TBM berkedip di pemutar, berarti buffer aktif dan terus merekam. Ketuk untuk membuka TimeBack Machine.",
    "tbmModal.liveTitle": "📡 Kembali ke siaran langsung",
    "tbmModal.liveDesc": "Kapan saja, ketuk 'LIVE' untuk langsung kembali ke siaran langsung stasiun Anda.",
    "tbmModal.close": "Mengerti",
    "app.downloadTitle": "Aplikasi Seluler",
    "app.downloadDesc": "Dengarkan radio Anda di mana saja dengan aplikasi Android.",
    "app.downloadBtn": "Segera hadir",
    "footer.tagline": "Pemutar web premium untuk mendengarkan ribuan stasiun radio di seluruh dunia.",
    "footer.links": "Tautan berguna",
    "footer.contact": "Kontak",
    "footer.rights": "Semua hak dilindungi.",
    "privacy.title": "Kebijakan Privasi",
    "privacy.lastUpdated": "Terakhir diperbarui",
    "privacy.dataCollection": "Pengumpulan Data",
    "privacy.dataCollectionDesc": "RadioSphere.be tidak mengumpulkan data yang dapat diidentifikasi secara pribadi. Tidak perlu pendaftaran.",
    "privacy.localStorage": "Penyimpanan Lokal",
    "privacy.localStorageDesc": "Semua data disimpan secara eksklusif di perangkat Anda:",
    "privacy.localStorageFavorites": "Stasiun favorit Anda",
    "privacy.localStorageLang": "Preferensi bahasa Anda",
    "privacy.localStorageRecent": "Stasiun yang baru diputar",
    "privacy.localStoragePrefs": "Pengaturan antarmuka Anda",
    "privacy.analytics": "Pengukuran Audiens (Umami Analytics)",
    "privacy.analyticsDesc": "Kami menggunakan Umami Analytics, solusi analitik yang menghormati privasi dan sesuai GDPR.",
    "privacy.analyticsNoCookies": "Tidak ada cookie pelacakan",
    "privacy.analyticsAnonymous": "Data sepenuhnya dianonimkan",
    "privacy.analyticsGDPR": "Sesuai GDPR",
    "privacy.analyticsNoPersonal": "Tidak ada data pribadi yang dikumpulkan",
    "privacy.analyticsLearnMore": "Pelajari lebih lanjut tentang kebijakan privasi Umami",
    "privacy.thirdParty": "Layanan Pihak Ketiga",
    "privacy.thirdPartyDesc": "Stream audio disediakan langsung oleh stasiun radio melalui API komunitas Radio Browser.",
    "privacy.thirdPartyUmami": "Umami Analytics digunakan untuk mengukur lalu lintas situs secara anonim.",
    "privacy.permissions": "Browser Web",
    "privacy.permissionsDesc": "RadioSphere.be adalah situs web yang dapat diakses dari browser modern mana pun. Tidak perlu instalasi.",
    "privacy.security": "Keamanan",
    "privacy.securityDesc": "Karena tidak ada data pribadi yang dikumpulkan atau dikirim, risiko kebocoran data tidak ada.",
    "privacy.contact": "Kontak",
    "privacy.contactDesc": "Untuk pertanyaan tentang kebijakan privasi ini, hubungi kami di:",
    "player.selectStation": "Pilih stasiun untuk mulai mendengarkan",
    "home.greeting": "Halo 👋",
    "home.recentlyPlayed": "Baru diputar",
    "home.popularStations": "Stasiun populer",
    "home.localPopular": "Stasiun populer",
    "home.exploreByGenre": "Jelajahi berdasarkan genre",
    "home.yourFavorites": "Favorit Anda",
    "home.weeklyDiscoveries": "Penemuan mingguan",
    "home.popularNearYou": "Populer di dekat Anda",
    "home.noFavorites": "Tambahkan favorit untuk melihatnya di sini",
    "search.title": "Cari",
    "search.placeholder": "Cari stasiun...",
    "search.country": "Negara",
    "search.selectCountry": "Pilih negara",
    "search.clearCountry": "Hapus negara",
    "search.resetFilters": "Reset filter",
    "search.notFoundTitle": "Tidak menemukan stasiun favorit Anda?",
    "search.notFoundAddOn": "Anda bisa menambahkannya langsung di",
    "search.notFoundEmailUs": "Kami juga bisa mencoba menambahkannya untuk Anda: kirim email ke",
    "inAppBrowser.warning": "Untuk pengalaman yang lebih baik, buka RadioSphere.be di browser biasa Anda.",
    "inAppBrowser.openExternal": "Buka di browser",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "Tidak ada hasil",
    "search.networkError": "Kesalahan jaringan. Tidak dapat menghubungi server stasiun.",
    "search.countriesError": "Tidak dapat memuat daftar negara.",
    "search.retry": "Coba lagi",
    "search.useFilters": "Gunakan bilah pencarian atau filter untuk menemukan stasiun",
    "search.genre": "Genre",
    "search.language": "Bahasa",
    "search.loadMore": "Lebih banyak stasiun",
    "search.loadingMore": "Memuat...",
    "search.sortPopularity": "Popularitas",
    "search.sortAZ": "A-Z",
    "search.sortClicks": "Klik",
    "search.resultsCount": "stasiun ditemukan",
    "favorites.title": "Favorit",
    "favorites.empty": "Tidak ada favorit",
    "favorites.emptyDesc": "Ketuk hati pada stasiun untuk menambahkannya ke favorit",
    "favorites.sortName": "A-Z",
    "favorites.sortCountry": "Berdasarkan negara",
    "favorites.unknownCountry": "Negara tidak diketahui",
    "favorites.sortGenre": "Berdasarkan genre",
    "favorites.unknownGenre": "Genre tidak diketahui",
    "favorites.viewList": "Daftar",
    "favorites.viewMedium": "Thumbnail",
    "favorites.viewLarge": "Thumbnail besar",
    "favorites.viewSmall": "Thumbnail kecil",
    "premium.title": "RadioSphere.be Premium",
    "premium.subtitle": "Pengalaman radio terbaik",
    "premium.active": "Premium aktif",
    "premium.sleepTimer": "Timer Tidur",
    "premium.sleepTimerDesc": "Otomatis menghentikan pemutaran setelah waktu yang ditentukan",
    "premium.androidAuto": "Android Auto",
    "premium.androidAutoDesc": "Kontrol RadioSphere.be langsung dari Android Auto",
    "premium.chromecast": "Chromecast",
    "premium.chromecastDesc": "Transmisikan stasiun ke TV atau speaker melalui Chromecast",
    "premium.recorder": "Perekam",
    "premium.recorderDesc": "Rekam acara Anda dalam MP3 dan putar ulang hingga 5 menit",
    "premium.monthly": "Pembelian sekali — €9,99",
    "premium.buyLifetime": "Buka kunci selamanya",
    "premium.priceNote": "Harga indikatif. Jumlah akhir dapat bervariasi.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "Pulihkan pembelian",
    "premium.disclaimer": "Pembelian sekali, akses seumur hidup. Tanpa langganan.",
    "premium.comingSoon": "Segera hadir",
    "premium.passwordPlaceholder": "Masukkan kode akses",
    "premium.unlock": "Buka kunci",
    "premium.lock": "Kunci Premium",
    "premium.wrongPassword": "Kode salah",
    "premium.unlocked": "Premium terbuka!",
    "sleepTimer.title": "Timer Tidur",
    "sleepTimer.desc": "Otomatis menghentikan pemutaran setelah waktu tertentu",
    "sleepTimer.off": "Mati",
    "sleepTimer.active": "Aktif",
    "sleepTimer.remaining": "Tersisa",
    "sleepTimer.cancel": "Batalkan timer",
    "sleepTimer.stopped": "Pemutaran otomatis dijeda.",
    "sleepTimer.custom": "Kustom",
    "sleepTimer.customPlaceholder": "Menit",
    "sleepTimer.customGo": "Mulai",
    "sleepTimer.15": "15 mnt",
    "sleepTimer.30": "30 mnt",
    "sleepTimer.45": "45 mnt",
    "sleepTimer.60": "1 jam",
    "sleepTimer.90": "1j30",
    "sleepTimer.120": "2 jam",
    "player.nowPlaying": "Sedang diputar",
    "player.streamError": "Kesalahan pemutaran",
    "player.streamErrorDesc": "Tidak dapat memutar stream ini. Coba stasiun lain.",
    "player.error": "Kesalahan",
    "player.streamUnavailable": "Stasiun ini tidak memiliki URL stream.",
    "player.visitWebsite": "Kunjungi situs web",
    "player.timeout": "Waktu habis",
    "player.timeoutDesc": "Stream tidak merespons. Coba stasiun lain.",
    "player.unexpectedError": "Kesalahan tak terduga",
    "player.unexpectedErrorDesc": "Terjadi kesalahan. Silakan coba lagi.",
    "ssl.title": "Koneksi tidak aman",
    "ssl.description": "menggunakan koneksi tidak terenkripsi (HTTP). Masalah ini berasal dari server radio.",
    "ssl.technical": "Stream audio stasiun ini tidak memenuhi standar enkripsi SSL/TLS saat ini.",
    "ssl.acceptRisk": "Dengarkan dengan risiko sendiri",
    "exit.title": "Tutup aplikasi?",
    "exit.description": "Tekan sekali lagi untuk keluar dari RadioSphere.",
    "exit.confirm": "Keluar",
    "common.cancel": "Batal",
    "settings.title": "Pengaturan",
    "settings.language": "Bahasa",
    "settings.languageDesc": "Pilih bahasa antarmuka",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "Penggunaan data",
    "settings.dataWarningDesc": "Mendengarkan stasiun radio menggunakan koneksi internet dan dapat mengonsumsi data seluler.",
    "settings.dataDisclaimer": "Data lokal",
    "settings.dataDisclaimerDesc": "Favorit dan preferensi Anda disimpan secara lokal di perangkat Anda.",
    "settings.radioSource": "Sumber stasiun",
    "settings.radioSourceDesc": "Daftar stasiun disediakan oleh Radio Browser, API komunitas dengan lebih dari 50.000 stasiun radio.",
    "settings.radioSourceLink": "Kunjungi Radio Browser",
    "settings.radioSourceAddStation": "Tambah stasiun",
    "settings.analytics": "Pelacakan Audiens",
    "settings.analyticsDesc": "RadioSphere.be menggunakan Umami Analytics yang menghormati privasi.",
    "settings.analyticsNoCookies": "Tanpa cookie pelacakan",
    "settings.analyticsAnonymous": "Data sepenuhnya anonim",
    "settings.analyticsGDPR": "Sesuai GDPR",
    "settings.analyticsUsage": "Hanya mengukur penggunaan umum",
    "settings.analyticsLearnMore": "Pelajari lebih lanjut tentang Umami",
    "favorites.manage": "Kelola favorit",
    "favorites.export": "Ekspor sebagai CSV",
    "favorites.import": "Impor CSV",
    "favorites.share": "Bagikan favorit saya",
    "favorites.exported": "Favorit diekspor",
    "favorites.imported": "favorit diimpor",
    "favorites.importError": "Kesalahan impor",
    "favorites.refreshingMetadata": "Mengambil metadata...",
    "favorites.metadataRefreshed": "Metadata diperbarui",
    "favorites.unavailableStations": "Stasiun tidak ditemukan",
    "favorites.unavailableDesc": "Stasiun-stasiun ini tidak lagi terdaftar di Radio Browser:",
    "favorites.understood": "Mengerti",
    "favorites.noFavoritesToExport": "Tidak ada favorit untuk diekspor",
    "favorites.refreshMetadata": "Perbarui metadata",
    "settings.privacyPolicy": "Kebijakan Privasi",
    "settings.reopenWelcome": "Buka kembali halaman selamat datang",
    "settings.resetApp": "Reset aplikasi",
    "settings.resetAppDesc": "Hapus semua favorit, stasiun terbaru, dan preferensi",
    "settings.resetConfirm": "Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan.",
    "settings.resetDone": "Aplikasi direset",
    "settings.resetButton": "Hapus semua",
    "premium.restorePurchases": "Pulihkan pembelian",
    "premium.restoreSuccess": "Pembelian berhasil dipulihkan",
    "premium.restoreNone": "Tidak ada pembelian untuk dipulihkan",
    "guide.title": "Panduan Pengguna",
    "guide.button": "Panduan Pengguna",
    "guide.home": "Beranda",
    "guide.homeContent": "Layar beranda menampilkan stasiun yang baru diputar, stasiun populer, favorit, penemuan mingguan, dan genre.",
    "guide.search": "Cari",
    "guide.searchContent": "Cari stasiun berdasarkan nama, lalu filter berdasarkan negara, genre, atau bahasa.",
    "guide.favorites": "Favorit",
    "guide.favoritesContent": "Ketuk ikon hati pada stasiun untuk menambahkannya ke favorit.",
    "guide.settings": "Pengaturan",
    "guide.settingsContent": "Ubah bahasa antarmuka, aktifkan timer tidur, kelola favorit Anda.",
    "guide.permissions": "Izin",
    "guide.permissionsContent": "RadioSphere.be meminta beberapa izin: notifikasi, lokasi, dan penyimpanan.",
    "guide.permissionsContentDesktop": "Pada versi web, RadioSphere.be tidak meminta izin sistem apa pun: pemutaran audio berjalan secara native di browser Anda. Tidak ada data pribadi yang dikumpulkan. Untuk menikmati kontrol layar kunci, Chromecast bawaan, dan perekaman lokal, instal aplikasi Android gratis dari Google Play.",
    "guide.permissionsContentMobile": "Di ponsel Anda, RadioSphere.be (web) mungkin meminta izin untuk menampilkan notifikasi kontrol pemutaran. Untuk fitur lebih lanjut (Chromecast, rekaman tersimpan di perangkat, kontrol layar kunci), instal aplikasi Android gratis dari Google Play.",
    "guide.permissionsReRequest": "Minta ulang izin",
    "guide.permissionsReopenWelcome": "Muat ulang halaman selamat datang",
    "guide.sleepTimer": "Timer Tidur",
    "guide.sleepTimerContent": "Jadwalkan penghentian pemutaran otomatis (15 mnt hingga 2 jam).",
    "guide.recorder": "TimeBack Machine",
    "guide.recorderContent": "Rekam acara favorit Anda dalam MP3 langsung dari pemutar layar penuh.",
    "guide.chromecast": "Chromecast",
    "guide.chromecastContent": "Transmisikan stasiun radio ke TV atau speaker melalui Chromecast.",
    "welcome.subtitle": "Radio dunia di ujung jari Anda",
    "welcome.chooseLanguage": "Pilih bahasa",
    "welcome.start": "Mulai",
    "welcome.stations": "50.000+ stasiun",
    "welcome.search": "Pencarian lanjutan",
    "welcome.favExport": "Favorit & ekspor",
    "welcome.genres": "25 genre musik",
    "welcome.sleepTimer": "Pengatur waktu tidur",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "Putar ulang siaran langsung",
    "genre.60s": "60-an",
    "genre.70s": "70-an",
    "genre.80s": "80-an",
    "genre.90s": "90-an",
    "genre.ambient": "Ambient",
    "genre.blues": "Blues",
    "genre.chillout": "Chillout",
    "genre.classical": "Klasik",
    "genre.country": "Country",
    "genre.electronic": "Elektronik",
    "genre.funk": "Funk",
    "genre.hiphop": "Hip-Hop",
    "genre.jazz": "Jazz",
    "genre.latin": "Latin",
    "genre.metal": "Metal",
    "genre.news": "Berita",
    "genre.pop": "Pop",
    "genre.r&b": "R&B",
    "genre.reggae": "Reggae",
    "genre.rock": "Rock",
    "genre.soul": "Soul",
    "genre.techno": "Techno",
    "genre.trance": "Trance",
    "genre.world": "Dunia",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "Mentransmisikan ke",
    "cast.controlFromPhone": "Kontrol dari ponsel Anda",
    "cast.connected": "Terhubung",
    "cast.disconnected": "Terputus",
    "cast.unsupportedBrowser": "Chromecast tersedia di Google Chrome atau aplikasi Android.",
    "cast.openInChrome": "Buka di Chrome untuk menggunakan Chromecast",
    "player.live": "LIVE",
    "player.recording": "Merekam",
    "player.recordingStarted": "Perekaman dimulai",
    "player.recordingStopped": "Perekaman selesai",
    "player.recordingMaxReached": "Durasi maksimum tercapai (10 mnt)",
    "player.saveRecording": "Simpan ke ponsel",
    "player.shareRecording": "Bagikan rekaman",
    "player.returnToLive": "Kembali ke siaran langsung",
    "player.recordPremiumOnly": "Perekaman adalah fitur Premium",
    "player.fileSaved": "File tersimpan!",
    "player.backInTime": "Kembali ke Masa Lalu",
    "player.bufferLoading": "Memuat buffer...",
    "player.recordingNotAvailable": "Perekaman tidak tersedia",
    "player.recordingContinuesLive": "Kembali live, perekaman berlanjut...",
    "player.codec": "Codec",
    "player.bitrate": "Bitrate",
    "player.language": "Bahasa",
    "player.noStreamInfo": "Tidak ada info dari stream atau Radio Browser",
    "onboarding.title": "Selamat datang di RadioSphere.be",
    "onboarding.free": "100% Gratis",
    "onboarding.freeDesc": "Akses tak terbatas tanpa langganan",
    "onboarding.noAds": "Tanpa Iklan Tambahan",
    "onboarding.noAdsDesc": "Tidak ada iklan yang ditambahkan oleh RadioSphere.be.",
    "onboarding.tbm": "TimeBack Machine",
    "onboarding.tbmDesc": "Putar ulang radio langsung kapan saja",
    "onboarding.cta": "Segera di Google Play",
    "onboarding.dismiss": "Jangan tampilkan lagi",
    "tbmQuota.title": "Ingin perjalanan waktu tanpa batas?",
    "tbmQuota.description": "Di web, TimeBack Machine terbatas: putar mundur hingga 2 menit dan rekam hingga maks. 5 menit, dengan kuota total 10 mnt/hari di seluler untuk menjaga kestabilan. Versi premium di Google Play memungkinkan putar mundur hingga 5 menit dan rekam hingga 30 menit, tanpa kuota.",
    "tbmQuota.cta": "Unduh di Google Play",
    "tbmQuota.continueLive": "Lanjutkan live",
    "tbmQuota.warning": "Nikmati TimeBack Machine tanpa batas di aplikasi kami!",
    "home.androidTitle": "RadioSphere.be di Android",
    "home.androidDesc": "Dengarkan stasiun favorit Anda di mana saja dengan Android Auto, Chromecast, dan TimeBack Machine.",
    "home.comingSoon": "Segera hadir",
    "notFound.message": "Ups! Halaman tidak ditemukan",
    "notFound.backHome": "Kembali ke Beranda",
    "footer.poweredByPrefix": "Didukung oleh ",
    "footer.poweredBySuffix": " yang luar biasa. Terima kasih kepada Alex Segler untuk proyek komunitas ini.",
    "footer.createdBy": "Dibuat oleh Franck Malherbe",
    "aria.play": "Putar",
    "aria.pause": "Jeda",
    "aria.addFavorite": "Tambah ke favorit",
    "aria.removeFavorite": "Hapus dari favorit",
    "aria.close": "Tutup",
    "aria.refresh": "Segarkan"
  },
  ms: {},
  // populated below from id (mutually intelligible)
  ar: {
    "nav.home": "الرئيسية",
    "nav.search": "بحث",
    "nav.explore": "بحث واستكشاف",
    "nav.favorites": "المفضلة",
    "nav.premium": "بريميوم",
    "nav.settings": "الإعدادات",
    "nav.about": "حول",
    "sidebar.stationCount": "أكثر من 50,000 محطة إذاعية في 230+ دولة، مجاناً، بدون تسجيل، بدون إعلانات إضافية.",
    "sidebar.tbmTeaser": "ميزتنا الحصرية: آلة الزمن — أعد البث المباشر إلى الوراء، استمع إلى آخر 5 دقائق، سجّل برامجك بصيغة MP3. مشغّل الراديو عبر الإنترنت الذي يتيح لك العودة بالزمن.",
    "sidebar.tbmHowItWorks": "كيف تعمل؟",
    "sidebar.podcastTeaser": "هل تريد بودكاست؟",
    "tbmModal.title": "آلة الزمن — كيف تعمل؟",
    "tbmModal.intro": "آلة الزمن ميزة حصرية في RadioSphere.be تُحدث ثورة في الاستماع إلى الراديو عبر الإنترنت. لن تفوّت لحظة مهمة على الهواء بعد الآن!",
    "tbmModal.bufferTitle": "🔄 الذاكرة المؤقتة الذكية (5 دقائق)",
    "tbmModal.bufferDesc": "بمجرد أن تستمع إلى محطة، يقوم RadioSphere.be تلقائياً بتسجيل آخر 5 دقائق في ذاكرة دائرية في الخلفية. لا حاجة إلى تفعيل أي شيء: الأمر تلقائي وسلس.",
    "tbmModal.rewindTitle": "⏪ إعادة البث المباشر",
    "tbmModal.rewindDesc": "هل فاتك خبر أو أغنية أو لحظة مهمة؟ افتح آلة الزمن وأعد حتى 5 دقائق إلى الوراء. استخدم أزرار -15ث/+15ث أو اسحب على الخط الزمني للتنقل بدقة.",
    "tbmModal.recordTitle": "🔴 التسجيل بصيغة MP3",
    "tbmModal.recordDesc": "اضغط على REC لالتقاط حتى 10 دقائق من البث بصيغة MP3 مباشرة من المشغّل. مثالي لحفظ مقابلة أو أغنية أو برنامج كامل.",
    "tbmModal.iconTitle": "💡 أيقونة TBM الوامضة",
    "tbmModal.iconDesc": "عندما تومض أيقونة TBM في المشغّل، فهذا يعني أن الذاكرة المؤقتة نشطة وتسجل باستمرار. اضغط عليها لفتح آلة الزمن والوصول إلى آخر دقائق الاستماع.",
    "tbmModal.liveTitle": "📡 العودة إلى البث المباشر",
    "tbmModal.liveDesc": "في أي وقت، اضغط على «مباشر» للعودة فوراً إلى البث المباشر للمحطة.",
    "tbmModal.close": "فهمت",
    "app.downloadTitle": "تطبيق الجوال",
    "app.downloadDesc": "استمع إلى إذاعاتك في كل مكان عبر تطبيق أندرويد.",
    "app.downloadBtn": "قريباً",
    "footer.tagline": "مشغّل الويب المتميّز للاستماع إلى آلاف المحطات الإذاعية حول العالم.",
    "footer.links": "روابط مفيدة",
    "footer.contact": "اتصال",
    "footer.rights": "جميع الحقوق محفوظة.",
    "privacy.title": "سياسة الخصوصية",
    "privacy.lastUpdated": "آخر تحديث",
    "privacy.dataCollection": "جمع البيانات",
    "privacy.dataCollectionDesc": "لا يجمع RadioSphere.be أي بيانات شخصية تعريفية. لا يُطلب أي تسجيل لاستخدام الخدمة. لا نتتبّع عاداتك في الاستماع ولا نشارك أي معلومات مع أطراف ثالثة.",
    "privacy.localStorage": "التخزين المحلي",
    "privacy.localStorageDesc": "تُخزَّن جميع البيانات حصرياً على جهازك عبر التخزين المحلي للمتصفح:",
    "privacy.localStorageFavorites": "محطاتك المفضلة",
    "privacy.localStorageLang": "تفضيل اللغة لديك",
    "privacy.localStorageRecent": "محطاتك المُستمَع إليها مؤخراً",
    "privacy.localStoragePrefs": "إعدادات الواجهة لديك",
    "privacy.analytics": "قياس الجمهور (Umami Analytics)",
    "privacy.analyticsDesc": "نستخدم Umami Analytics، وهو حل لقياس الجمهور يحترم الخصوصية ومتوافق مع GDPR. لا يجمع Umami أي بيانات شخصية تعريفية، ولا يستخدم أي ملفات تعريف ارتباط، وجميع البيانات مجهولة الهوية. نقيس فقط إحصاءات الاستخدام العامة (الصفحات المُزارة، الميزات المستخدمة) لتحسين الخدمة. يُستضاف Umami على خوادمه السحابية الآمنة.",
    "privacy.analyticsNoCookies": "لا تُستخدم أي ملفات تعريف ارتباط للتتبّع",
    "privacy.analyticsAnonymous": "بيانات مجهولة الهوية بالكامل",
    "privacy.analyticsGDPR": "متوافق مع GDPR الأوروبي",
    "privacy.analyticsNoPersonal": "لا تُجمع أي بيانات شخصية تعريفية",
    "privacy.analyticsLearnMore": "اعرف المزيد عن سياسة خصوصية Umami",
    "privacy.thirdParty": "خدمات الأطراف الثالثة",
    "privacy.thirdPartyDesc": "تُقدَّم تدفقات الصوت مباشرةً من المحطات الإذاعية عبر واجهة Radio Browser المجتمعية (radio-browser.info). لا يتحكم RadioSphere.be في المحتوى المُذاع من هذه المحطات. قد تحتوي تدفقات الصوت على إعلانات تُدرجها المحطات المُذيعة مباشرةً — لا يملك RadioSphere.be أي وسيلة لتصفيتها أو حظرها.",
    "privacy.thirdPartyUmami": "يُستخدم Umami Analytics (cloud.umami.is) لقياس جمهور الموقع بشكل مجهول. لا تُستخدم أي ملفات تعريف ارتباط، ولا تُجمع أي بيانات شخصية. تُولَّد فقط إحصاءات مجمَّعة ومجهولة.",
    "privacy.permissions": "متصفّح الويب",
    "privacy.permissionsDesc": "RadioSphere.be موقع ويب يمكن الوصول إليه من أي متصفّح حديث. لا يلزم أي تثبيت. لا يستخدم الموقع ملفات تعريف ارتباط من أطراف ثالثة. يُستخدم فقط التخزين المحلي للمتصفح (localStorage) لحفظ تفضيلاتك.",
    "privacy.security": "الأمان",
    "privacy.securityDesc": "بما أنه لا تُجمع أو تُرسَل أي بيانات شخصية، فإن خطر تسرّب البيانات معدوم. لا تغادر مفضلاتك وتفضيلاتك جهازك أبداً.",
    "privacy.contact": "اتصال",
    "privacy.contactDesc": "لأي سؤال يخص سياسة الخصوصية هذه، يمكنك التواصل معنا على:",
    "player.selectStation": "اختر محطة لبدء الاستماع",
    "home.greeting": "مرحباً 👋",
    "home.recentlyPlayed": "الإذاعات الأخيرة",
    "home.popularStations": "محطات شائعة",
    "home.localPopular": "محطات شائعة",
    "home.exploreByGenre": "استكشف حسب النوع",
    "home.yourFavorites": "مفضلاتك",
    "home.weeklyDiscoveries": "اكتشافات الأسبوع",
    "home.popularNearYou": "شائعة بالقرب منك",
    "home.noFavorites": "أضف مفضلات لتظهر هنا",
    "search.title": "بحث",
    "search.placeholder": "ابحث عن محطة...",
    "search.country": "الدولة",
    "search.selectCountry": "اختر دولة",
    "search.clearCountry": "مسح الدولة",
    "search.resetFilters": "إعادة تعيين الفلاتر",
    "search.notFoundTitle": "ألا تجد محطتك المفضلة؟",
    "search.notFoundAddOn": "يمكنك إضافتها مباشرة على",
    "search.notFoundEmailUs": "يمكننا أيضًا محاولة إضافتها نيابة عنك: راسلنا عبر البريد الإلكتروني على",
    "inAppBrowser.warning": "للحصول على تجربة أفضل، افتح RadioSphere.be في متصفحك المعتاد.",
    "inAppBrowser.openExternal": "افتح في المتصفح",
    "search.addStationSubject": "Adding a new station",
    "search.noResults": "لا توجد نتائج",
    "search.networkError": "خطأ في الشبكة. تعذّر الوصول إلى خادم المحطات.",
    "search.countriesError": "تعذّر تحميل قائمة الدول.",
    "search.retry": "إعادة المحاولة",
    "search.useFilters": "استخدم شريط البحث أو الفلاتر للعثور على محطات",
    "search.genre": "النوع",
    "search.language": "اللغة",
    "search.loadMore": "المزيد من المحطات",
    "search.loadingMore": "جارٍ التحميل...",
    "search.sortPopularity": "الشعبية",
    "search.sortAZ": "أ-ي",
    "search.sortClicks": "النقرات",
    "search.resultsCount": "محطات تم العثور عليها",
    "favorites.title": "المفضلة",
    "favorites.empty": "لا توجد مفضلات",
    "favorites.emptyDesc": "اضغط على القلب في محطة لإضافتها إلى مفضلاتك",
    "favorites.sortName": "أ-ي",
    "favorites.sortCountry": "حسب الدولة",
    "favorites.unknownCountry": "دولة غير معروفة",
    "favorites.sortGenre": "حسب النوع",
    "favorites.unknownGenre": "نوع غير معروف",
    "favorites.viewList": "قائمة",
    "favorites.viewMedium": "صور مصغّرة",
    "favorites.viewLarge": "صور كبيرة",
    "favorites.viewSmall": "صور صغيرة",
    "premium.title": "RadioSphere.be بريميوم",
    "premium.subtitle": "تجربة الراديو الأمثل",
    "premium.active": "بريميوم مفعّل",
    "premium.sleepTimer": "مؤقّت النوم",
    "premium.sleepTimerDesc": "يوقف التشغيل تلقائياً بعد مهلة قابلة للضبط",
    "premium.androidAuto": "أندرويد أوتو",
    "premium.androidAutoDesc": "تحكّم في RadioSphere.be مباشرة من أندرويد أوتو",
    "premium.chromecast": "كروم كاست",
    "premium.chromecastDesc": "أرسل محطاتك إلى تلفازك أو مكبّر الصوت المتصل عبر كروم كاست",
    "premium.recorder": "مسجّل",
    "premium.recorderDesc": "سجّل برامجك بصيغة MP3 وأعد حتى 5 دقائق إلى الوراء",
    "premium.monthly": "شراء لمرة واحدة — €9.99",
    "premium.buyLifetime": "افتح للأبد",
    "premium.priceNote": "السعر إرشادي. قد يختلف المبلغ النهائي حسب الدولة.",
    "premium.yearly": "",
    "premium.yearlySave": "",
    "premium.cancel": "استعادة الشراء",
    "premium.disclaimer": "شراء لمرة واحدة، وصول مدى الحياة. بدون اشتراك.",
    "premium.comingSoon": "قريباً",
    "premium.passwordPlaceholder": "أدخل رمز الوصول",
    "premium.unlock": "فتح",
    "premium.lock": "قفل بريميوم",
    "premium.wrongPassword": "رمز خاطئ",
    "premium.unlocked": "تم فتح بريميوم!",
    "sleepTimer.title": "مؤقّت النوم",
    "sleepTimer.desc": "يوقف التشغيل تلقائياً بعد وقت محدّد",
    "sleepTimer.off": "متوقّف",
    "sleepTimer.active": "نشط",
    "sleepTimer.remaining": "المتبقّي",
    "sleepTimer.cancel": "إلغاء المؤقّت",
    "sleepTimer.stopped": "تم إيقاف التشغيل تلقائياً.",
    "sleepTimer.custom": "مخصّص",
    "sleepTimer.customPlaceholder": "دقائق",
    "sleepTimer.customGo": "موافق",
    "sleepTimer.15": "15 دقيقة",
    "sleepTimer.30": "30 دقيقة",
    "sleepTimer.45": "45 دقيقة",
    "sleepTimer.60": "ساعة واحدة",
    "sleepTimer.90": "ساعة ونصف",
    "sleepTimer.120": "ساعتان",
    "player.nowPlaying": "يُشغَّل الآن",
    "player.streamError": "خطأ في التشغيل",
    "player.streamErrorDesc": "تعذّر تشغيل هذا البث. جرّب محطة أخرى.",
    "player.error": "خطأ",
    "player.streamUnavailable": "هذه المحطة لا تحتوي على رابط بث.",
    "player.visitWebsite": "زيارة الموقع",
    "player.timeout": "انتهت المهلة",
    "player.timeoutDesc": "البث لا يستجيب. جرّب محطة أخرى.",
    "player.unexpectedError": "خطأ غير متوقّع",
    "player.unexpectedErrorDesc": "حدث خطأ. الرجاء المحاولة مرة أخرى.",
    "ssl.title": "اتصال غير آمن",
    "ssl.description": "يستخدم اتصالاً غير مشفّر (HTTP). هذه المشكلة تأتي من خادم الإذاعة وليست من RadioSphere.be. قد تُعترَض بياناتك.",
    "ssl.technical": "بث الصوت لهذه المحطة لا يلبّي معايير التشفير SSL/TLS الحالية. لا يستطيع RadioSphere.be ضمان أمان هذا الاتصال.",
    "ssl.acceptRisk": "الاستماع على مسؤوليتي",
    "exit.title": "إغلاق التطبيق؟",
    "exit.description": "اضغط رجوع مرة أخرى للخروج من RadioSphere.",
    "exit.confirm": "خروج",
    "common.cancel": "إلغاء",
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.languageDesc": "اختر لغة الواجهة",
    "settings.french": "Français",
    "settings.english": "English",
    "settings.dataWarning": "استهلاك البيانات",
    "settings.dataWarningDesc": "الاستماع إلى محطات الإذاعة يستخدم اتصال الإنترنت وقد يستهلك بيانات الجوال. ننصح باستخدام Wi-Fi للاستماع المطوّل.",
    "settings.dataDisclaimer": "بيانات محلية",
    "settings.dataDisclaimerDesc": "تُخزَّن مفضلاتك وتفضيلاتك محلياً على جهازك. لا تُرسَل أي بيانات شخصية إلى أي خادم.",
    "settings.radioSource": "مصدر المحطات",
    "settings.radioSourceDesc": "قائمة المحطات مقدَّمة من Radio Browser، واجهة مجتمعية مجانية ومفتوحة تفهرس أكثر من 50,000 محطة إذاعية حول العالم.",
    "settings.radioSourceLink": "زيارة Radio Browser",
    "settings.radioSourceAddStation": "إضافة محطة",
    "settings.analytics": "تتبّع الجمهور",
    "settings.analyticsDesc": "يستخدم RadioSphere.be Umami Analytics، حلاً تحليلياً يحترم الخصوصية ومتوافقاً مع GDPR.",
    "settings.analyticsNoCookies": "بدون ملفات تعريف ارتباط للتتبّع",
    "settings.analyticsAnonymous": "بيانات مجهولة الهوية بالكامل",
    "settings.analyticsGDPR": "متوافق مع GDPR",
    "settings.analyticsUsage": "يقيس فقط الاستخدام العام (مشاهدات الصفحات، الميزات المستخدمة)",
    "settings.analyticsLearnMore": "اعرف المزيد عن Umami",
    "favorites.manage": "إدارة المفضلة",
    "favorites.export": "تصدير بصيغة CSV",
    "favorites.import": "استيراد CSV",
    "favorites.share": "مشاركة مفضلاتي",
    "favorites.exported": "تم تصدير المفضلة",
    "favorites.imported": "تم استيراد المفضلة",
    "favorites.importError": "خطأ في الاستيراد",
    "favorites.refreshingMetadata": "جارٍ جلب البيانات الوصفية...",
    "favorites.metadataRefreshed": "تم تحديث البيانات الوصفية",
    "favorites.unavailableStations": "محطات غير موجودة",
    "favorites.unavailableDesc": "هذه المحطات لم تعد مدرجة في Radio Browser وقد لا تكون متاحة:",
    "favorites.understood": "فهمت",
    "favorites.noFavoritesToExport": "لا توجد مفضلات للتصدير",
    "favorites.refreshMetadata": "تحديث البيانات الوصفية",
    "settings.privacyPolicy": "سياسة الخصوصية",
    "settings.reopenWelcome": "إعادة فتح صفحة الترحيب",
    "settings.resetApp": "إعادة تعيين التطبيق",
    "settings.resetAppDesc": "حذف جميع المفضلات والمحطات الأخيرة والتفضيلات",
    "settings.resetConfirm": "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.",
    "settings.resetDone": "تمت إعادة تعيين التطبيق",
    "settings.resetButton": "حذف كل شيء",
    "premium.restorePurchases": "استعادة المشتريات",
    "premium.restoreSuccess": "تمت استعادة المشتريات بنجاح",
    "premium.restoreNone": "لا توجد مشتريات لاستعادتها",
    "guide.title": "دليل المستخدم",
    "guide.button": "دليل المستخدم",
    "guide.home": "الرئيسية",
    "guide.homeContent": "تعرض الشاشة الرئيسية محطاتك المُستمَع إليها مؤخراً، والمحطات الشائعة، والوصول السريع إلى المفضلة، واكتشافات الأسبوع، واستكشاف الأنواع الموسيقية.",
    "guide.search": "بحث",
    "guide.searchContent": "ابحث عن محطة بالاسم، ثم رشّح حسب الدولة أو النوع أو اللغة. رتّب النتائج حسب الشعبية أو الترتيب الأبجدي أو عدد النقرات. حمّل المزيد من النتائج في الأسفل.",
    "guide.favorites": "المفضلة",
    "guide.favoritesContent": "اضغط على القلب في محطة لإضافتها إلى مفضلاتك. من الإعدادات، يمكنك تصدير مفضلاتك بصيغة CSV أو استيرادها أو مشاركتها.",
    "guide.settings": "الإعدادات",
    "guide.settingsContent": "غيّر لغة الواجهة، فعّل مؤقّت النوم، أدِر مفضلاتك (تصدير/استيراد/مشاركة)، اطّلع على معلومات مصدر المحطات وسياسة الخصوصية.",
    "guide.permissions": "الأذونات",
    "guide.permissionsContent": "يطلب RadioSphere.be بعض الأذونات للعمل بالكامل: الإشعارات تتيح أزرار التحكم على شاشة القفل؛ الموقع مطلوب لاكتشاف أجهزة كروم كاست القريبة؛ الوصول إلى التخزين يتيح حفظ تسجيلاتك على هاتفك. لا تُجمع أو تُرسَل أي بيانات شخصية. إذا رفضت إذناً عن طريق الخطأ، يمكنك إعادة طلبه أدناه أو إعادة تحميل صفحة الترحيب.",
    "guide.permissionsContentDesktop": "في النسخة الويب، لا يطلب RadioSphere.be أي أذونات نظام: يعمل تشغيل الصوت بشكل أصلي في متصفحك. لا تُجمع أي بيانات شخصية. للاستفادة من أدوات التحكم على شاشة القفل وكروم كاست المدمج والتسجيل المحلي، ثبّت تطبيق أندرويد المجاني من Google Play.",
    "guide.permissionsContentMobile": "على هاتفك، قد يطلب RadioSphere.be (الويب) إذناً لعرض إشعارات أدوات التحكم في التشغيل. لمزيد من الميزات (كروم كاست، التسجيلات المحفوظة على الجهاز، التحكم من شاشة القفل)، ثبّت تطبيق أندرويد المجاني من Google Play.",
    "guide.permissionsReRequest": "إعادة طلب الأذونات",
    "guide.permissionsReopenWelcome": "إعادة تحميل صفحة الترحيب",
    "guide.sleepTimer": "مؤقّت النوم",
    "guide.sleepTimerContent": "جدوِل إيقاف التشغيل تلقائياً بعد مهلة من اختيارك (15 دقيقة إلى ساعتين أو مدة مخصّصة). مثالي للنوم على الراديو. فعّله من الإعدادات.",
    "guide.recorder": "آلة الزمن",
    "guide.recorderContent": "سجّل برامجك المفضلة بصيغة MP3 مباشرة من المشغّل بملء الشاشة. تتيح ذاكرة الـ 5 دقائق أيضاً إعادة الاستماع لما فاتك للتو. اضغط على REC لبدء التسجيل (10 دقائق كحد أقصى). عندما تومض أيقونة TBM، فهذا يعني أن الذاكرة المؤقتة نشطة وتسجل في الخلفية. اضغط على الأيقونة الوامضة لفتح مشغّل آلة الزمن وإعادة الاستماع للدقائق الأخيرة.",
    "guide.chromecast": "كروم كاست",
    "guide.chromecastContent": "أرسل محطاتك الإذاعية إلى تلفازك أو مكبّر الصوت المتصل عبر كروم كاست. اضغط على أيقونة Cast في المشغّل لبدء البث.",
    "welcome.subtitle": "إذاعات العالم في متناول يدك",
    "welcome.chooseLanguage": "اختر اللغة",
    "welcome.start": "ابدأ",
    "welcome.stations": "أكثر من 50,000 محطة",
    "welcome.search": "بحث متقدّم",
    "welcome.favExport": "المفضلة والتصدير",
    "welcome.genres": "25 نوعاً موسيقياً",
    "welcome.sleepTimer": "مؤقّت النوم",
    "welcome.tbm": "TimeBack Machine",
    "welcome.tbmDesc": "أعد الاستماع للبث المباشر",
    "genre.60s": "الستينات",
    "genre.70s": "السبعينات",
    "genre.80s": "الثمانينات",
    "genre.90s": "التسعينات",
    "genre.ambient": "أمبيانت",
    "genre.blues": "بلوز",
    "genre.chillout": "شيل آوت",
    "genre.classical": "كلاسيكي",
    "genre.country": "كانتري",
    "genre.electronic": "إلكتروني",
    "genre.funk": "فانك",
    "genre.hiphop": "هيب هوب",
    "genre.jazz": "جاز",
    "genre.latin": "لاتيني",
    "genre.metal": "ميتال",
    "genre.news": "أخبار",
    "genre.pop": "بوب",
    "genre.r&b": "آر آند بي",
    "genre.reggae": "ريغي",
    "genre.rock": "روك",
    "genre.soul": "سول",
    "genre.techno": "تكنو",
    "genre.trance": "ترانس",
    "genre.world": "موسيقى العالم",
    "genre.mousemusic": "Mouse & Music",
    "cast.castingTo": "البث إلى",
    "cast.controlFromPhone": "تحكّم من هاتفك",
    "cast.connected": "متصل",
    "cast.disconnected": "غير متصل",
    "cast.unsupportedBrowser": "كروم كاست متاح في Google Chrome أو تطبيق أندرويد.",
    "cast.openInChrome": "افتح في Chrome لاستخدام كروم كاست",
    "player.live": "مباشر",
    "player.recording": "تسجيل",
    "player.recordingStarted": "بدأ التسجيل",
    "player.recordingStopped": "انتهى التسجيل",
    "player.recordingMaxReached": "تم بلوغ الحد الأقصى (10 دقائق)",
    "player.saveRecording": "حفظ على الهاتف",
    "player.shareRecording": "مشاركة التسجيل",
    "player.returnToLive": "العودة إلى المباشر",
    "player.recordPremiumOnly": "التسجيل ميزة بريميوم",
    "player.fileSaved": "تم حفظ الملف!",
    "player.backInTime": "العودة بالزمن",
    "player.bufferLoading": "جارٍ تحميل الذاكرة المؤقتة...",
    "player.recordingNotAvailable": "التسجيل غير متاح",
    "player.recordingContinuesLive": "العودة إلى المباشر، التسجيل مستمر...",
    "player.codec": "الترميز",
    "player.bitrate": "معدّل البت",
    "player.language": "اللغة",
    "player.noStreamInfo": "لا توجد معلومات مقدّمة من البث أو Radio Browser",
    "onboarding.title": "مرحباً بك في RadioSphere.be",
    "onboarding.free": "مجاني 100٪",
    "onboarding.freeDesc": "وصول غير محدود، بدون اشتراك",
    "onboarding.noAds": "بدون إعلانات مُضافة",
    "onboarding.noAdsDesc": "لا إعلانات يضيفها RadioSphere.be. قد تتضمّن المحطات إعلاناتها الخاصة في بثّها.",
    "onboarding.tbm": "آلة الزمن",
    "onboarding.tbmDesc": "أعد البث المباشر إلى الوراء في أي وقت",
    "onboarding.cta": "قريباً على Google Play",
    "onboarding.dismiss": "لا تُظهر مرة أخرى",
    "tbmQuota.title": "تريد سفراً غير محدود في الزمن؟",
    "tbmQuota.description": "على الويب، آلة الزمن محدودة: الإرجاع حتى دقيقتين والتسجيل حتى 5 دقائق كحد أقصى، مع حصة إجمالية تبلغ 10 دقائق/يوم على الجوال لضمان الاستقرار. النسخة المميزة المتوفرة على Google Play تتيح الإرجاع حتى 5 دقائق والتسجيل حتى 30 دقيقة، دون أي حصة.",
    "tbmQuota.cta": "حمّل من Google Play",
    "tbmQuota.continueLive": "متابعة المباشر",
    "tbmQuota.warning": "استمتع بآلة زمن غير محدودة عبر تطبيقنا!",
    "home.androidTitle": "RadioSphere.be على أندرويد",
    "home.androidDesc": "استمع إلى محطاتك المفضلة في أي مكان، مع أندرويد أوتو وكروم كاست وآلة الزمن.",
    "home.comingSoon": "قريباً",
    "notFound.message": "عذراً! الصفحة غير موجودة",
    "notFound.backHome": "العودة إلى الرئيسية",
    "footer.poweredByPrefix": "مدعوم من ",
    "footer.poweredBySuffix": ". شكر خاص لـ Alex Segler على هذا المشروع المجتمعي.",
    "footer.createdBy": "أنشأه Franck Malherbe",
    "aria.play": "تشغيل",
    "aria.pause": "إيقاف مؤقت",
    "aria.addFavorite": "أضف إلى المفضلة",
    "aria.removeFavorite": "أزل من المفضلة",
    "aria.close": "إغلاق",
    "aria.refresh": "تحديث"
  },
  th: {}
};
translations.ms = { ...translations.id };
translations.th = { ...translations.id };
translations["pt-BR"] = { ...translations.pt };
translations["hi"] = { ...translations.en };
const LanguageContext = createContext(void 0);
const SUPPORTED_LANGUAGES = ["fr", "en", "es", "de", "ja", "it", "nl", "pt-BR", "pt", "pl", "zh", "tr", "ru", "id", "ms", "th", "ar", "hi"];
const RTL_LANGUAGES = ["ar"];
function detectInitialLanguage() {
  var _a;
  try {
    const stored = localStorage.getItem("radiosphere_language");
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
    const nav = (_a = navigator.language) == null ? void 0 : _a.toLowerCase();
    for (const lang of SUPPORTED_LANGUAGES) {
      if (nav == null ? void 0 : nav.startsWith(lang.toLowerCase())) return lang;
    }
    return "en";
  } catch {
    return "en";
  }
}
function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  useEffect(() => {
    const detected = detectInitialLanguage();
    if (detected !== "en") {
      startTransition(() => setLanguageState(detected));
    }
  }, []);
  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("radiosphere_language", lang);
    } catch {
    }
  }, []);
  useEffect(() => {
    try {
      document.documentElement.lang = language;
      document.documentElement.dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
    } catch {
    }
  }, [language]);
  const t = useCallback((key) => {
    return translations[language][key] ?? key;
  }, [language]);
  return /* @__PURE__ */ jsx(LanguageContext.Provider, { value: { language, setLanguage, t }, children });
}
function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
function safeGetItem(key) {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
function safeRemoveItem(key) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
function safeClearAll() {
  let ok = true;
  try {
    localStorage == null ? void 0 : localStorage.clear();
  } catch {
    ok = false;
  }
  try {
    sessionStorage == null ? void 0 : sessionStorage.clear();
  } catch {
    ok = false;
  }
  return ok;
}
function safeSessionGet(key) {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSessionSet(key, value) {
  try {
    if (typeof sessionStorage === "undefined") return false;
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
function safeSessionRemove(key) {
  try {
    if (typeof sessionStorage === "undefined") return false;
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
const FAVORITES_KEY = "radioflow_favorites";
const RECENT_KEY = "radioflow_recent";
function loadFromStorage(key, fallback) {
  try {
    const raw = safeGetItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [favHydrated, setFavHydrated] = useState(false);
  useEffect(() => {
    setFavorites(
      loadFromStorage(FAVORITES_KEY, []).sort((a, b) => a.name.localeCompare(b.name))
    );
    setFavHydrated(true);
  }, []);
  useEffect(() => {
    if (!favHydrated) return;
    safeSetItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, favHydrated]);
  const toggleFavorite = useCallback((station) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === station.id);
      const next = exists ? prev.filter((s) => s.id !== station.id) : [...prev, station];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);
  const isFavorite = useCallback((id) => favorites.some((s) => s.id === id), [favorites]);
  const importFavorites = useCallback((stations) => {
    let addedCount = 0;
    setFavorites((prev) => {
      const existingUrls = new Map(prev.map((s) => [s.streamUrl, s]));
      const newStations = [];
      for (const s of stations) {
        const existing = existingUrls.get(s.streamUrl);
        if (existing) {
          if (s.logo && !existing.logo) {
            existingUrls.set(s.streamUrl, { ...existing, ...s, id: s.id || existing.id });
          }
        } else {
          newStations.push(s);
          addedCount++;
        }
      }
      const updated = Array.from(existingUrls.values());
      return [...updated, ...newStations].sort((a, b) => a.name.localeCompare(b.name));
    });
    return addedCount;
  }, []);
  return { favorites, toggleFavorite, isFavorite, importFavorites };
}
function useRecentStations() {
  const [recent, setRecent] = useState([]);
  const [recHydrated, setRecHydrated] = useState(false);
  useEffect(() => {
    setRecent(loadFromStorage(RECENT_KEY, []));
    setRecHydrated(true);
  }, []);
  useEffect(() => {
    if (!recHydrated) return;
    safeSetItem(RECENT_KEY, JSON.stringify(recent));
  }, [recent, recHydrated]);
  const addRecent = useCallback((station) => {
    setRecent((prev) => {
      const filtered = prev.filter((s) => s.id !== station.id);
      return [station, ...filtered].slice(0, 20);
    });
  }, []);
  return { recent, addRecent };
}
const FavoritesContext = createContext(null);
function FavoritesProvider({ children }) {
  const { favorites, toggleFavorite, isFavorite, importFavorites } = useFavorites();
  const { recent, addRecent } = useRecentStations();
  return /* @__PURE__ */ jsx(FavoritesContext.Provider, { value: { favorites, toggleFavorite, isFavorite, importFavorites, recent, addRecent }, children });
}
function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavoritesContext must be used within FavoritesProvider");
  return ctx;
}
const FALLBACK_MIRRORS = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info"
];
const USER_AGENT = "RadioSphere/1.0";
const REQUEST_TIMEOUT_MS = 5e3;
const MAX_MIRROR_ATTEMPTS = 6;
let cachedWorkingMirror = null;
let dynamicMirrors = null;
let mirrorFetchPromise = null;
const blacklistedMirrors = /* @__PURE__ */ new Map();
const BLACKLIST_DURATION_MS = 6e4;
function isBlacklisted(mirror) {
  const expiry = blacklistedMirrors.get(mirror);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    blacklistedMirrors.delete(mirror);
    return false;
  }
  return true;
}
function blacklistMirror(mirror) {
  blacklistedMirrors.set(mirror, Date.now() + BLACKLIST_DURATION_MS);
}
async function fetchJsonArray(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  let text;
  try {
    text = await res.text();
  } catch (e) {
    throw new Error(`[RadioService] Failed to read body from ${url}: ${e instanceof Error ? e.message : String(e)}`);
  }
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`[RadioService] Empty body from ${url}`);
  }
  if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) {
    throw new Error(`[RadioService] HTML response instead of JSON from ${url} (Cloudflare/auth wall/poisoned cache)`);
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    throw new Error(`[RadioService] JSON parse failed for ${url}: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`[RadioService] Expected array but got ${typeof parsed} from ${url}`);
  }
  return parsed;
}
function createTimeoutSignal(externalSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}
async function fetchDynamicMirrors() {
  try {
    const signal = createTimeoutSignal();
    const data = await fetchJsonArray(
      "https://all.api.radio-browser.info/json/servers",
      { signal }
    );
    const urls = data.map((s) => `https://${s.name}`).filter((u) => u.includes("api.radio-browser.info"));
    const merged = [...FALLBACK_MIRRORS, ...urls.filter((u) => !FALLBACK_MIRRORS.includes(u))];
    return merged;
  } catch (e) {
    console.warn("[RadioService] Dynamic mirror fetch failed, using fallbacks:", e);
    return FALLBACK_MIRRORS;
  }
}
async function getMirrors() {
  if (dynamicMirrors) return dynamicMirrors;
  if (!mirrorFetchPromise) {
    mirrorFetchPromise = fetchDynamicMirrors().then((mirrors) => {
      dynamicMirrors = mirrors;
      return mirrors;
    });
  }
  return mirrorFetchPromise;
}
async function fetchWithMirrors(path, params, externalSignal) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const allMirrors = await getMirrors();
  const available = allMirrors.filter((m) => !isBlacklisted(m));
  if (available.length === 0) {
    blacklistedMirrors.clear();
    available.push(...allMirrors);
  }
  const mirrors = cachedWorkingMirror && available.includes(cachedWorkingMirror) ? [cachedWorkingMirror, ...available.filter((m) => m !== cachedWorkingMirror)] : available;
  const toTry = mirrors.slice(0, Math.min(MAX_MIRROR_ATTEMPTS, mirrors.length));
  let lastError = null;
  for (const mirror of toTry) {
    if (externalSignal == null ? void 0 : externalSignal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      const signal = createTimeoutSignal(externalSignal);
      const url = `${mirror}/json/${path}${query}`;
      const data = await fetchJsonArray(url, {
        headers: { "User-Agent": USER_AGENT },
        signal
      });
      cachedWorkingMirror = mirror;
      console.debug(`[RadioService] ✓ ${mirror} for ${path}`);
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.name === "AbortError" && (externalSignal == null ? void 0 : externalSignal.aborted)) {
        throw err;
      }
      console.warn(`[RadioService] ✗ ${mirror} for ${path}:`, err.message);
      blacklistMirror(mirror);
      lastError = err;
    }
  }
  throw lastError || new Error("[RadioService] All mirrors failed");
}
function getCachedWorkingMirror() {
  return cachedWorkingMirror || FALLBACK_MIRRORS[0];
}
const FALLBACK_URL = "https://raw.githubusercontent.com/Mrbender7/RadioBrowserAPIBackup/refs/heads/main/data/stations.json";
const FALLBACK_FETCH_TIMEOUT_MS = 15e3;
let fallbackCache = null;
let fallbackFetchPromise = null;
function normalizeStation$1(raw) {
  return {
    id: raw.stationuuid || raw.id || "",
    name: raw.name || "Unknown",
    streamUrl: raw.url_resolved || raw.url || "",
    logo: raw.favicon || "",
    country: raw.country || "",
    countryCode: raw.countrycode || "",
    tags: raw.tags ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    language: raw.language || "",
    codec: raw.codec || "",
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
    clickcount: raw.clickcount || 0,
    homepage: raw.homepage || ""
  };
}
async function loadFallbackData() {
  if (fallbackCache) return fallbackCache;
  if (fallbackFetchPromise) return fallbackFetchPromise;
  fallbackFetchPromise = (async () => {
    console.warn("[RadioService] ⚠ Loading fallback station database from GitHub...");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FALLBACK_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(FALLBACK_URL, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let text;
      try {
        text = await res.text();
      } catch (e) {
        throw new Error(`[RadioService] Failed to read fallback body: ${e instanceof Error ? e.message : String(e)}`);
      }
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error(`[RadioService] Empty fallback body`);
      }
      if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) {
        throw new Error(`[RadioService] HTML response from fallback URL (likely WebView interstitial / poisoned cache)`);
      }
      let raw;
      try {
        raw = JSON.parse(trimmed);
      } catch (e) {
        throw new Error(`[RadioService] Fallback JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (!Array.isArray(raw)) {
        throw new Error(`[RadioService] Fallback expected array, got ${typeof raw}`);
      }
      const stations = raw.map(normalizeStation$1).filter((s) => s.streamUrl && s.name);
      fallbackCache = stations;
      console.log(`[RadioService] ✓ Fallback loaded: ${stations.length} stations`);
      return stations;
    } catch (e) {
      clearTimeout(timer);
      fallbackFetchPromise = null;
      throw e;
    }
  })();
  return fallbackFetchPromise;
}
function sortStations(stations, order = "votes", reverse = true) {
  const sorted = [...stations];
  sorted.sort((a, b) => {
    switch (order) {
      case "name":
        return a.name.localeCompare(b.name);
      case "clickcount":
        return a.clickcount - b.clickcount;
      case "votes":
      default:
        return a.votes - b.votes;
    }
  });
  if (reverse) sorted.reverse();
  return sorted;
}
async function fallbackSearchStations(params) {
  const all = await loadFallbackData();
  let results = all;
  if (params.name) {
    const q = params.name.toLowerCase();
    results = results.filter((s) => s.name.toLowerCase().includes(q));
  }
  if (params.country) {
    const c = params.country.toLowerCase();
    results = results.filter(
      (s) => s.country.toLowerCase() === c || s.countryCode.toLowerCase() === c || s.country.toLowerCase().includes(c)
    );
  }
  if (params.tag) {
    const t = params.tag.toLowerCase();
    results = results.filter(
      (s) => s.tags.some((tag) => tag.toLowerCase() === t || tag.toLowerCase().includes(t))
    );
  }
  if (params.tagList) {
    const tags = params.tagList.toLowerCase().split(",").map((t) => t.trim()).filter(Boolean);
    results = results.filter(
      (s) => tags.some(
        (t) => s.tags.some((st) => st.toLowerCase() === t || st.toLowerCase().includes(t))
      )
    );
  }
  if (params.language) {
    const l = params.language.toLowerCase();
    results = results.filter((s) => s.language.toLowerCase().includes(l));
  }
  const order = params.order || "votes";
  const reverse = params.reverse !== "false";
  results = sortStations(results, order, reverse);
  const offset = params.offset || 0;
  const limit = params.limit || 30;
  return results.slice(offset, offset + limit);
}
async function fallbackGetTopStations(limit = 20) {
  const all = await loadFallbackData();
  return sortStations(all, "votes", true).slice(0, limit);
}
async function fallbackGetStationsByTag(tag, limit = 20) {
  return fallbackSearchStations({ tag, limit, order: "votes", reverse: "true" });
}
async function fallbackGetStationsByCountry(country, limit = 20) {
  return fallbackSearchStations({ country, limit, order: "votes", reverse: "true" });
}
async function fallbackGetCountries() {
  const all = await loadFallbackData();
  const countryMap = /* @__PURE__ */ new Map();
  for (const s of all) {
    if (!s.country || !s.countryCode) continue;
    const key = s.countryCode.toUpperCase();
    const existing = countryMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      countryMap.set(key, { name: s.country, iso_3166_1: key, count: 1 });
    }
  }
  return Array.from(countryMap.values()).map((c) => ({ name: c.name, iso_3166_1: c.iso_3166_1, stationcount: c.count })).sort((a, b) => a.name.localeCompare(b.name));
}
async function fallbackSearchStationByUrl(streamUrl) {
  const all = await loadFallbackData();
  return all.find((s) => s.streamUrl === streamUrl) || null;
}
function normalizeStation(raw) {
  return {
    id: raw.stationuuid || raw.id || "",
    name: raw.name || "Unknown",
    streamUrl: raw.url_resolved || raw.url || "",
    logo: raw.favicon || "",
    country: raw.country || "",
    countryCode: raw.countrycode || "",
    tags: raw.tags ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    language: raw.language || "",
    codec: raw.codec || "",
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
    clickcount: raw.clickcount || 0,
    homepage: raw.homepage || ""
  };
}
async function searchStationByUrl(streamUrl) {
  try {
    const data = await fetchWithMirrors("stations/byurl", { url: streamUrl, limit: "1" });
    if (data.length > 0) return normalizeStation(data[0]);
    const data2 = await fetchWithMirrors("stations/search", { url: streamUrl, limit: "1" });
    if (data2.length > 0) return normalizeStation(data2[0]);
    return null;
  } catch {
    console.warn("[RadioService] API failed for searchStationByUrl, trying fallback...");
    try {
      return await fallbackSearchStationByUrl(streamUrl);
    } catch {
      return null;
    }
  }
}
async function reportStationClick(stationuuid) {
  if (!stationuuid) return;
  try {
    const mirror = getCachedWorkingMirror();
    await fetch(`${mirror}/json/url/${stationuuid}`, {
      headers: { "User-Agent": USER_AGENT }
    });
  } catch {
  }
}
async function getCountries(signal) {
  try {
    const data = await fetchWithMirrors("countries", { order: "name", reverse: "false" }, signal);
    return data.filter((c) => c.name && c.iso_3166_1 && c.stationcount > 0).map((c) => ({ name: c.name, iso_3166_1: c.iso_3166_1, stationcount: c.stationcount })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    console.warn("[RadioService] API failed for getCountries, trying fallback...");
    return fallbackGetCountries();
  }
}
const radioBrowserProvider = {
  async searchStations(params) {
    const query = {
      limit: String(params.limit || 30),
      offset: String(params.offset || 0),
      order: params.order || "votes",
      reverse: params.reverse ?? "true",
      hidebroken: "true"
    };
    if (params.name) query.name = params.name.trim();
    if (params.country) query.country = params.country;
    if (params.tag) query.tag = params.tag.trim().toLowerCase();
    if (params.tagList) query.tagList = params.tagList.trim().toLowerCase();
    if (params.language) query.language = params.language;
    try {
      const data = await fetchWithMirrors("stations/search", query, params.signal);
      return data.map(normalizeStation);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      console.warn("[RadioService] API failed for searchStations, trying fallback...");
      return fallbackSearchStations({
        name: params.name,
        country: params.country,
        tag: params.tag,
        tagList: params.tagList,
        language: params.language,
        limit: params.limit,
        offset: params.offset,
        order: params.order,
        reverse: params.reverse
      });
    }
  },
  async getTopStations(limit = 20) {
    try {
      const data = await fetchWithMirrors("stations/topvote", { limit: String(limit), hidebroken: "true" });
      return data.map(normalizeStation);
    } catch {
      console.warn("[RadioService] API failed for getTopStations, trying fallback...");
      return fallbackGetTopStations(limit);
    }
  },
  async getStationsByTag(tag, limit = 20) {
    try {
      const data = await fetchWithMirrors("stations/bytag/" + encodeURIComponent(tag), { limit: String(limit), order: "votes", reverse: "true", hidebroken: "true" });
      return data.map(normalizeStation);
    } catch {
      console.warn("[RadioService] API failed for getStationsByTag, trying fallback...");
      return fallbackGetStationsByTag(tag, limit);
    }
  },
  async getStationsByCountry(country, limit = 20) {
    try {
      const data = await fetchWithMirrors("stations/bycountry/" + encodeURIComponent(country), { limit: String(limit), order: "votes", reverse: "true", hidebroken: "true" });
      return data.map(normalizeStation);
    } catch {
      console.warn("[RadioService] API failed for getStationsByCountry, trying fallback...");
      return fallbackGetStationsByCountry(country, limit);
    }
  }
};
const IN_APP_BROWSER_REGEX = /FBAN|FBAV|FB_IAB|FB4A|FBIOS|FBSV|FBDV|FBMD|Messenger|MessengerLite|Instagram|Threads|Barcelona|Line\/|MicroMessenger|Twitter|TikTok|musical_ly|BytedanceWebview|Snapchat|Pinterest|LinkedInApp|KAKAOTALK|NAVER|WhatsApp|GSA\/|Reddit/i;
function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return IN_APP_BROWSER_REGEX.test(ua);
}
function isCapacitorNative$1() {
  if (typeof window === "undefined") return false;
  const cap = window.Capacitor;
  return typeof (cap == null ? void 0 : cap.isNativePlatform) === "function" && cap.isNativePlatform() === true;
}
function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua);
}
function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}
function isLocalStorageWorking() {
  try {
    const k = "__rs_probe__";
    localStorage.setItem(k, "1");
    const v = localStorage.getItem(k);
    localStorage.removeItem(k);
    return v === "1";
  } catch {
    return false;
  }
}
function openInExternalBrowser(url) {
  if (typeof window === "undefined") return false;
  if (isAndroid()) {
    try {
      const cleaned = url.replace(/^https?:\/\//, "");
      const intent = `intent://${cleaned}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intent;
      return true;
    } catch {
    }
  }
  if (isIOS()) {
    try {
      const safariUrl = url.replace(/^https?:\/\//, "x-safari-https://");
      window.location.href = safariUrl;
      return true;
    } catch {
    }
  }
  try {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return true;
  } catch {
  }
  try {
    window.location.href = url;
    return true;
  } catch {
    return false;
  }
}
async function copyToClipboard(text) {
  var _a;
  try {
    if ((_a = navigator.clipboard) == null ? void 0 : _a.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
function isNative() {
  if (typeof window === "undefined") return false;
  try {
    const cap = window.Capacitor;
    return !!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
  } catch {
    return false;
  }
}
async function loadCapacitorPlugin(name) {
  if (!isNative()) return null;
  try {
    const mod = await import(
      /* @vite-ignore */
      "@capacitor/core"
    );
    return mod.registerPlugin(name);
  } catch (e) {
    console.warn(`[RadioSphere] Failed to load Capacitor plugin "${name}":`, e);
    return null;
  }
}
const CAST_APP_ID = "CC1AD845";
let CastPluginInstance = null;
let CastPluginPromise = null;
async function getCastPlugin() {
  if (CastPluginInstance) return CastPluginInstance;
  if (!CastPluginPromise) {
    CastPluginPromise = loadCapacitorPlugin("CastPlugin").then((p) => {
      CastPluginInstance = p;
      return p;
    });
  }
  return CastPluginPromise;
}
const isCapacitorNative = isNative;
function useCast() {
  const [isCastAvailable, setIsCastAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castDeviceName, setCastDeviceName] = useState(null);
  const [castUiMode, setCastUiMode] = useState("fallback");
  const [castInitState, setCastInitState] = useState("idle");
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const initDoneRef = useRef(false);
  const remotePlayerRef = useRef(null);
  const remotePlayerControllerRef = useRef(null);
  const isNative2 = useRef(isCapacitorNative()).current;
  useEffect(() => {
    var _a;
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    setCastInitState("initializing");
    if (!isNative2 && isInAppBrowser()) {
      console.log("[RadioSphere][Cast] In-app WebView detected → skipping Cast init");
      setCastUiMode("fallback");
      setCastInitState("unavailable");
      setIsCastAvailable(false);
      return;
    }
    if (isNative2) {
      console.log("[RadioSphere][Cast] Native platform, initializing CastPlugin...");
      setCastUiMode("native");
      const initNativeCast = async () => {
        try {
          const plugin = await getCastPlugin();
          if (!plugin) {
            console.warn("[RadioSphere][Cast] CastPlugin unavailable on this platform");
            setCastInitState("unavailable");
            setIsCastAvailable(false);
            return;
          }
          const permStatus = await plugin.checkDiscoveryPermissions();
          console.log("[RadioSphere][Cast] checkDiscoveryPermissions:", JSON.stringify(permStatus));
          let granted = permStatus.granted;
          if (!granted) {
            console.log("[RadioSphere][Cast] Permissions manquantes, demande en cours...");
            const permResult = await plugin.requestDiscoveryPermissions();
            console.log("[RadioSphere][Cast] requestDiscoveryPermissions:", JSON.stringify(permResult));
            granted = permResult.granted;
          }
          setPermissionsGranted(granted);
          if (!granted) {
            console.warn("[RadioSphere][Cast] Permissions Cast refusées: découverte indisponible");
            setIsCastAvailable(false);
            setCastInitState("unavailable");
            return;
          }
          const result = await plugin.initialize();
          console.log("[RadioSphere][Cast] CastPlugin initialized:", JSON.stringify(result));
          console.log("[RadioSphere][Cast] initialized=" + result.initialized + ", available=" + result.available + ", appId=" + (result.appId || "N/A"));
          const initialized = !!result.initialized;
          const available = !!result.available;
          setIsCastAvailable(available);
          setPermissionsGranted(result.permissionsGranted ?? granted);
          setCastInitState(initialized ? "ready" : "unavailable");
          if (!initialized) {
            console.warn("[RadioSphere][Cast] initialize() n'a pas retourné initialized=true");
          }
          plugin.addListener("castDevicesAvailable", (data) => {
            console.log("[RadioSphere][Cast] castDevicesAvailable event:", JSON.stringify(data));
            setIsCastAvailable(data.available);
          });
          plugin.addListener("castStateChanged", (data) => {
            console.log("[RadioSphere][Cast] castStateChanged event:", JSON.stringify(data));
            if (!data.connected && data.errorCode !== void 0) {
              console.error(`[RadioSphere][Cast] ❌ Session failed — errorCode=${data.errorCode}, reason=${data.reason || "unknown"}`);
            }
            setIsCasting(data.connected);
            setCastDeviceName(data.connected ? data.deviceName : null);
          });
          plugin.addListener("localAudioControl", (data) => {
            console.log("[RadioSphere][Cast] localAudioControl event:", JSON.stringify(data));
          });
        } catch (err) {
          console.warn("[RadioSphere][Cast] CastPlugin init error:", err);
          setCastInitState("unavailable");
          setIsCastAvailable(false);
        }
      };
      void initNativeCast();
      return;
    }
    console.log("[RadioSphere][Cast] Web platform, initializing Cast SDK...");
    let webInitDone = false;
    const initWebCastContext = () => {
      if (webInitDone) return;
      const cast = window.cast;
      if (!(cast == null ? void 0 : cast.framework)) {
        console.warn("[RadioSphere][Cast] cast.framework not available at init time");
        setCastUiMode("fallback");
        setCastInitState("unavailable");
        return;
      }
      webInitDone = true;
      console.log("[RadioSphere][Cast] Initializing CastContext with App ID:", CAST_APP_ID);
      try {
        cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: CAST_APP_ID,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
        const ctx = cast.framework.CastContext.getInstance();
        ctx.addEventListener(
          cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (event) => {
            var _a2;
            const session = ctx.getCurrentSession();
            if (event.sessionState === cast.framework.SessionState.SESSION_STARTED || event.sessionState === cast.framework.SessionState.SESSION_RESUMED) {
              setIsCasting(true);
              setCastDeviceName(((_a2 = session == null ? void 0 : session.getCastDevice()) == null ? void 0 : _a2.friendlyName) || null);
              remotePlayerRef.current = new cast.framework.RemotePlayer();
              remotePlayerControllerRef.current = new cast.framework.RemotePlayerController(remotePlayerRef.current);
            } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
              setIsCasting(false);
              setCastDeviceName(null);
              remotePlayerRef.current = null;
              remotePlayerControllerRef.current = null;
            }
          }
        );
        ctx.addEventListener(
          cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          (event) => {
            const available = event.castState !== cast.framework.CastState.NO_DEVICES_AVAILABLE;
            console.log("[RadioSphere][Cast] Cast state:", event.castState, "available:", available);
            setIsCastAvailable(available);
          }
        );
        setCastUiMode("launcher");
        setCastInitState("ready");
        setIsCastAvailable(true);
        setPermissionsGranted(true);
        console.log("[RadioSphere][Cast] CastContext initialized ✓");
      } catch (e) {
        console.warn("[RadioSphere][Cast] SDK init error:", e);
        setCastUiMode("fallback");
        setCastInitState("unavailable");
      }
    };
    if (((_a = window.cast) == null ? void 0 : _a.framework) || window.__castSdkReady) {
      console.log("[RadioSphere][Cast] SDK already available, init immediately");
      initWebCastContext();
    }
    window.__onGCastApiAvailable = (isAvailable) => {
      console.log("[RadioSphere][Cast] __onGCastApiAvailable:", isAvailable);
      if (isAvailable) {
        initWebCastContext();
      } else {
        setCastUiMode("fallback");
        setCastInitState("unavailable");
      }
    };
    const handleBridgeEvent = () => {
      console.log("[RadioSphere][Cast] castSdkReady event received");
      initWebCastContext();
    };
    window.addEventListener("castSdkReady", handleBridgeEvent);
    const safetyTimeout = setTimeout(() => {
      if (!webInitDone) {
        console.log("[RadioSphere][Cast] Safety timeout: SDK never loaded → fallback");
        setCastUiMode("fallback");
        setCastInitState("unavailable");
      }
    }, 1e4);
    return () => {
      clearTimeout(safetyTimeout);
      window.removeEventListener("castSdkReady", handleBridgeEvent);
    };
  }, [isNative2]);
  const startCast = useCallback(async () => {
    var _a, _b, _c, _d;
    if (isNative2) {
      const plugin = await getCastPlugin();
      if (!plugin) return;
      try {
        await plugin.requestSession();
      } catch (e) {
        console.warn("[RadioSphere][Cast] requestSession error:", e);
      }
    } else {
      try {
        (_d = (_c = (_b = (_a = window.cast) == null ? void 0 : _a.framework) == null ? void 0 : _b.CastContext) == null ? void 0 : _c.getInstance()) == null ? void 0 : _d.requestSession();
      } catch (e) {
        console.warn("[RadioSphere][Cast] Cast request error:", e);
      }
    }
  }, [isNative2]);
  const stopCast = useCallback(() => {
    var _a, _b, _c, _d, _e;
    if (isNative2) {
      void (async () => {
        const plugin = await getCastPlugin();
        if (!plugin) return;
        plugin.endSession().catch(
          (e) => console.warn("[RadioSphere][Cast] endSession error:", e)
        );
      })();
    } else {
      try {
        (_e = (_d = (_c = (_b = (_a = window.cast) == null ? void 0 : _a.framework) == null ? void 0 : _b.CastContext) == null ? void 0 : _c.getInstance()) == null ? void 0 : _d.getCurrentSession()) == null ? void 0 : _e.endSession(true);
      } catch (e) {
        console.warn("[RadioSphere][Cast] Cast stop error:", e);
      }
    }
  }, [isNative2]);
  const loadMedia = useCallback(
    (station) => {
      var _a, _b, _c, _d;
      if (isNative2) {
        console.log("[RadioSphere][Cast] loadMedia (native):", station.name, "URL:", station.streamUrl);
        void (async () => {
          const plugin = await getCastPlugin();
          if (!plugin) return;
          plugin.loadMedia({
            streamUrl: station.streamUrl,
            title: station.name,
            logo: station.logo || "",
            tags: (station.tags || []).join(","),
            stationId: station.id
          }).catch(
            (e) => console.warn("[RadioSphere][Cast] loadMedia error:", e)
          );
        })();
      } else {
        try {
          const session = (_d = (_c = (_b = (_a = window.cast) == null ? void 0 : _a.framework) == null ? void 0 : _b.CastContext) == null ? void 0 : _c.getInstance()) == null ? void 0 : _d.getCurrentSession();
          if (!session) return;
          const chr = window.chrome;
          const mediaInfo = new chr.cast.media.MediaInfo(station.streamUrl, "audio/*");
          mediaInfo.streamType = chr.cast.media.StreamType.LIVE;
          mediaInfo.metadata = new chr.cast.media.MusicTrackMediaMetadata();
          mediaInfo.metadata.title = station.name;
          mediaInfo.metadata.artist = "RadioSphere.be";
          const logoUrl = station.logo ? station.logo.replace("http://", "https://") : `${window.location.origin}/favicon.png`;
          mediaInfo.metadata.images = [new chr.cast.Image(logoUrl)];
          mediaInfo.customData = {
            tags: station.tags || [],
            stationId: station.id
          };
          const request = new chr.cast.media.LoadRequest(mediaInfo);
          session.loadMedia(request).then(
            () => console.log("[RadioSphere][Cast] Media loaded"),
            (err) => console.warn("[RadioSphere][Cast] Load error:", err)
          );
        } catch (e) {
          console.warn("[RadioSphere][Cast] loadMedia error:", e);
        }
      }
    },
    [isNative2]
  );
  const toggleCastPlayPause = useCallback(() => {
    if (isNative2) {
      void (async () => {
        const plugin = await getCastPlugin();
        if (!plugin) return;
        plugin.togglePlayPause().catch(
          (e) => console.warn("[RadioSphere][Cast] togglePlayPause error:", e)
        );
      })();
    } else {
      if (remotePlayerControllerRef.current) {
        remotePlayerControllerRef.current.playOrPause();
      }
    }
  }, [isNative2]);
  return {
    isCastAvailable,
    isCasting,
    castDeviceName,
    castUiMode,
    castInitState,
    permissionsGranted,
    startCast,
    stopCast,
    loadMedia,
    toggleCastPlayPause
  };
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
const AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-2 text-center sm:text-left", className), ...props });
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className), ...props });
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Title, { ref, className: cn("text-lg font-semibold", className), ...props }));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Description, { ref, className: cn("text-sm text-muted-foreground", className), ...props }));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Action, { ref, className: cn(buttonVariants(), className), ...props }));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
const SSLWarningDialog = React__default.forwardRef(function SSLWarningDialog2({ open, stationName, onAcceptRisk, onCancel }, _ref) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsx(AlertDialog, { open, onOpenChange: (v) => {
    if (!v) onCancel();
  }, children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsx(ShieldAlert, { className: "h-5 w-5 text-destructive" }) }),
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base", children: t("ssl.title") })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-sm leading-relaxed space-y-2", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: stationName }),
          " ",
          t("ssl.description")
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: t("ssl.technical") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(AlertDialogFooter, { className: "gap-2 sm:gap-2", children: [
      /* @__PURE__ */ jsx(AlertDialogCancel, { onClick: onCancel, children: t("common.cancel") }),
      /* @__PURE__ */ jsx(
        AlertDialogAction,
        {
          onClick: onAcceptRisk,
          className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          children: t("ssl.acceptRisk")
        }
      )
    ] })
  ] }) });
});
function umamiTrack$1(event, data) {
  var _a;
  if (typeof window === "undefined") return;
  try {
    const w = window;
    (_a = w.umami) == null ? void 0 : _a.track(event, data);
  } catch {
  }
}
function trackStationPlayed(station) {
  var _a;
  if (!station) return;
  const rawGenre = ((_a = station.tags) == null ? void 0 : _a[0]) ?? "unknown";
  const genre = String(rawGenre).toLowerCase().slice(0, 40) || "unknown";
  umamiTrack$1("station-played", {
    name: String(station.name ?? "unknown").slice(0, 80),
    genre,
    country: station.country ?? "unknown"
  });
}
const PLAY_TRACK_DELAY_MS = 3e4;
const isBrowser = typeof window !== "undefined";
function safeNewAudio() {
  try {
    return new Audio();
  } catch (e) {
    console.warn("[RadioSphere] new Audio() failed (likely WebView restriction):", e);
    return {};
  }
}
const globalAudio = isBrowser ? safeNewAudio() : {};
if (isBrowser) {
  try {
    globalAudio.playsInline = true;
    globalAudio.preload = "auto";
  } catch {
  }
}
const SILENCE_DATA_URI = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
const silentAudio = isBrowser ? safeNewAudio() : {};
if (isBrowser) {
  try {
    silentAudio.loop = true;
    silentAudio.volume = 0.01;
    silentAudio.src = SILENCE_DATA_URI;
  } catch (e) {
    console.warn("[RadioSphere] silentAudio init failed (likely WebView restriction):", e);
  }
}
function startSilentLoop() {
  var _a, _b, _c;
  try {
    (_c = (_a = silentAudio.play) == null ? void 0 : (_b = _a.call(silentAudio)).catch) == null ? void 0 : _c.call(_b, () => {
    });
  } catch {
  }
}
function stopSilentLoop() {
  var _a;
  try {
    (_a = silentAudio.pause) == null ? void 0 : _a.call(silentAudio);
    silentAudio.currentTime = 0;
  } catch {
  }
}
const PlayerContext = createContext(null);
function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
function PlayerProvider({ children, onStationPlay }) {
  const { t } = useTranslation();
  const { isCastAvailable, isCasting, castDeviceName, castUiMode, castInitState, startCast, stopCast, loadMedia: castLoadMedia, toggleCastPlayPause } = useCast();
  const audioRef = useRef(globalAudio);
  const wakeLockRef = useRef(null);
  const isPlayingRef = useRef(false);
  useRef(false);
  const heartbeatRef = useRef(null);
  const pendingCanplayRef = useRef(null);
  const pendingClearCanplayRef = useRef(null);
  const pendingTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const pausedAtRef = useRef(0);
  const currentStationRef = useRef(null);
  const streamDeadRef = useRef(false);
  const reloadStreamRef = useRef(() => {
  });
  const playTrackTimerRef = useRef(null);
  const playTrackStationRef = useRef(null);
  const [state, setState] = useState({
    currentStation: null,
    isPlaying: false,
    isBuffering: false,
    volume: 0.8,
    isFullScreen: false
  });
  const [sslWarning, setSslWarning] = useState(null);
  const sslAcceptedUrls = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    currentStationRef.current = state.currentStation;
  }, [state.currentStation]);
  const cancelPlayTracking = useCallback(() => {
    if (playTrackTimerRef.current) {
      clearTimeout(playTrackTimerRef.current);
      playTrackTimerRef.current = null;
    }
    playTrackStationRef.current = null;
  }, []);
  const armPlayTracking = useCallback((station) => {
    if (playTrackTimerRef.current) {
      clearTimeout(playTrackTimerRef.current);
      playTrackTimerRef.current = null;
    }
    playTrackStationRef.current = station;
    playTrackTimerRef.current = setTimeout(() => {
      var _a;
      playTrackTimerRef.current = null;
      if (isPlayingRef.current && ((_a = currentStationRef.current) == null ? void 0 : _a.id) === station.id) {
        trackStationPlayed(station);
      }
      playTrackStationRef.current = null;
    }, PLAY_TRACK_DELAY_MS);
  }, []);
  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {
      }
    }
  }, []);
  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {
      });
      wakeLockRef.current = null;
    }
  }, []);
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) return;
    heartbeatRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!isPlayingRef.current) return;
      if (audio.src && audio.src.startsWith("blob:")) return;
      const isDead = audio.paused && isPlayingRef.current || audio.networkState === 3 || audio.readyState < 2 && !audio.paused;
      if (isDead) {
        console.log(
          "[RadioSphere] Heartbeat: stream appears dead (paused:",
          audio.paused,
          "networkState:",
          audio.networkState,
          "readyState:",
          audio.readyState,
          ")"
        );
        reloadStreamRef.current();
      }
    }, 1e4);
  }, [requestWakeLock]);
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);
  const reloadStream = useCallback(() => {
    const audio = audioRef.current;
    const station = currentStationRef.current;
    if (!station || !station.streamUrl) return;
    if (retryCountRef.current >= 3) {
      console.warn("[RadioSphere] Max retries reached, giving up auto-reload");
      return;
    }
    retryCountRef.current += 1;
    console.log("[RadioSphere] Reloading stream (attempt", retryCountRef.current, "/ 3)");
    if (pendingCanplayRef.current) {
      audio.removeEventListener("canplay", pendingCanplayRef.current);
      pendingCanplayRef.current = null;
    }
    if (pendingClearCanplayRef.current) {
      audio.removeEventListener("canplay", pendingClearCanplayRef.current);
      pendingClearCanplayRef.current = null;
    }
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setState((s) => ({ ...s, isBuffering: true }));
    audio.src = station.streamUrl;
    audio.load();
    const onCanplay = () => {
      audio.play().then(() => {
        retryCountRef.current = 0;
        setState((s) => ({ ...s, isPlaying: true, isBuffering: false }));
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        startSilentLoop();
        startHeartbeat();
        requestWakeLock();
        console.log("[RadioSphere] Stream reloaded successfully");
      }).catch(() => {
        setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
      });
      audio.removeEventListener("canplay", onCanplay);
      pendingCanplayRef.current = null;
    };
    audio.addEventListener("canplay", onCanplay);
    pendingCanplayRef.current = onCanplay;
    const timeout = setTimeout(() => {
      audio.removeEventListener("canplay", onCanplay);
      pendingCanplayRef.current = null;
      if (audio.readyState < 3) {
        console.warn("[RadioSphere] Stream reload timeout");
        setState((s) => ({ ...s, isBuffering: false }));
      }
    }, 15e3);
    pendingTimeoutRef.current = timeout;
    const clearTimeoutOnCanplay = () => {
      clearTimeout(timeout);
      pendingTimeoutRef.current = null;
      audio.removeEventListener("canplay", clearTimeoutOnCanplay);
      pendingClearCanplayRef.current = null;
    };
    audio.addEventListener("canplay", clearTimeoutOnCanplay);
    pendingClearCanplayRef.current = clearTimeoutOnCanplay;
  }, [requestWakeLock, startHeartbeat]);
  useEffect(() => {
    reloadStreamRef.current = reloadStream;
  }, [reloadStream]);
  const updateMediaSession = useCallback((station, playing) => {
    if (!("mediaSession" in navigator)) return;
    const artworkUrl = station.logo ? station.logo.replace("http://", "https://") : new URL("/android-chrome-512x512.png", window.location.origin).href;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: "RadioSphere.be",
      album: station.country || "Live",
      artwork: [{ src: artworkUrl, sizes: "512x512", type: "image/png" }]
    });
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, []);
  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    isPlayingRef.current = true;
    audio.play().catch(() => {
      isPlayingRef.current = false;
    });
    startSilentLoop();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    setState((s) => {
      if (s.currentStation) {
        updateMediaSession(s.currentStation, true);
      }
      return { ...s, isPlaying: true };
    });
    requestWakeLock();
    startHeartbeat();
  }, [requestWakeLock, startHeartbeat, updateMediaSession]);
  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlayingRef.current = false;
    pausedAtRef.current = Date.now();
    audio.pause();
    stopSilentLoop();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    setState((s) => {
      if (s.currentStation) {
        updateMediaSession(s.currentStation, false);
      }
      return { ...s, isPlaying: false };
    });
    releaseWakeLock();
    stopHeartbeat();
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    cancelPlayTracking();
  }, [releaseWakeLock, stopHeartbeat, updateMediaSession, cancelPlayTracking]);
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", handlePause);
    navigator.mediaSession.setActionHandler("stop", handlePause);
    navigator.mediaSession.setActionHandler("seekbackward", null);
    navigator.mediaSession.setActionHandler("seekforward", null);
    navigator.mediaSession.setActionHandler("previoustrack", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [handlePlay, handlePause]);
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = state.volume;
    const handleError = () => {
      var _a;
      if (audio.src && audio.src.startsWith("blob:")) {
        console.warn("[RadioSphere] Blob playback error ignored (time-shift), StreamBuffer will handle recovery");
        return;
      }
      const station = currentStationRef.current;
      const isPageSecure = window.location.protocol === "https:";
      const isStreamInsecure = (_a = station == null ? void 0 : station.streamUrl) == null ? void 0 : _a.startsWith("http://");
      if (isPageSecure && isStreamInsecure && station && !sslAcceptedUrls.current.has(station.streamUrl)) {
        console.warn("[RadioSphere] SSL/mixed-content error detected for:", station.streamUrl);
        setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
        stopSilentLoop();
        stopHeartbeat();
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
        setSslWarning({ station });
        return;
      }
      streamDeadRef.current = true;
      console.error("[RadioSphere] Stream marked as dead (error event)");
      if (station) {
        const mediaErr = audio.error;
        umamiTrack$1("stream-playback-error", {
          name: String(station.name ?? "unknown").slice(0, 80),
          country: station.country ?? "unknown",
          code: (mediaErr == null ? void 0 : mediaErr.code) ?? 0,
          insecure: !!isStreamInsecure
        });
      }
      isPlayingRef.current = false;
      setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
      stopSilentLoop();
      stopHeartbeat();
      cancelPlayTracking();
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
      toast({ title: t("player.streamError"), description: t("player.streamErrorDesc"), variant: "destructive" });
    };
    audio.addEventListener("error", handleError);
    let lastPlayTrackedId = null;
    const handlePlaying = () => {
      if (audio.src && audio.src.startsWith("blob:")) return;
      const station = currentStationRef.current;
      if (!station || station.id === lastPlayTrackedId) return;
      lastPlayTrackedId = station.id;
      umamiTrack$1("stream-play", {
        name: String(station.name ?? "unknown").slice(0, 80),
        country: station.country ?? "unknown"
      });
    };
    audio.addEventListener("playing", handlePlaying);
    const handleStalled = () => {
      if (!isPlayingRef.current) return;
      if (audio.src && audio.src.startsWith("blob:")) return;
      if (Date.now() - pausedAtRef.current < 3e3) return;
      console.log("[RadioSphere] Stream stalled, scheduling reload in 2s");
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current && Date.now() - pausedAtRef.current >= 3e3 && (audio.readyState < 2 || audio.networkState === 3)) {
          reloadStreamRef.current();
        }
      }, 2e3);
    };
    const handleEnded = () => {
      if (!isPlayingRef.current) return;
      if (audio.src && audio.src.startsWith("blob:")) return;
      if (Date.now() - pausedAtRef.current < 3e3) return;
      console.log("[RadioSphere] Stream ended, reloading in 2s");
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        if (Date.now() - pausedAtRef.current >= 3e3) {
          reloadStreamRef.current();
        }
      }, 2e3);
    };
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("ended", handleEnded);
    const keepAlive = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          const recentPause = Date.now() - pausedAtRef.current < 2e3;
          if (isPlayingRef.current && !recentPause) {
            audio.play().catch(() => {
            });
            startSilentLoop();
            startHeartbeat();
            requestWakeLock();
            if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
          }
        }, 500);
      }
    };
    document.addEventListener("visibilitychange", keepAlive);
    return () => {
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("ended", handleEnded);
      document.removeEventListener("visibilitychange", keepAlive);
      stopHeartbeat();
      releaseWakeLock();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (playTrackTimerRef.current) clearTimeout(playTrackTimerRef.current);
    };
  }, []);
  const playInternal = useCallback(async (station, bypassSSL = false) => {
    var _a, _b;
    try {
      if (!station.streamUrl) {
        console.error("[RadioSphere] Cannot play station with no stream URL.");
        toast({ title: t("player.error"), description: t("player.streamUnavailable"), variant: "destructive" });
        return;
      }
      const isPageSecure = window.location.protocol === "https:";
      const isStreamInsecure = station.streamUrl.startsWith("http://");
      if (isPageSecure && isStreamInsecure && !bypassSSL && !sslAcceptedUrls.current.has(station.streamUrl)) {
        console.warn("[RadioSphere] Insecure stream detected:", station.streamUrl);
        setSslWarning({ station });
        return;
      }
      if (isCasting) {
        console.log("[RadioSphere] Cast is active, playing only on TV");
        const audio2 = audioRef.current;
        audio2.pause();
        stopSilentLoop();
        stopHeartbeat();
        retryCountRef.current = 0;
        isPlayingRef.current = true;
        setState((s) => ({ ...s, currentStation: station, isBuffering: false, isPlaying: true }));
        const secureLogo2 = (_a = station.logo) == null ? void 0 : _a.replace("http://", "https://");
        updateMediaSession({ ...station, logo: secureLogo2 }, true);
        onStationPlay == null ? void 0 : onStationPlay(station);
        reportStationClick(station.id);
        requestWakeLock();
        armPlayTracking(station);
        castLoadMedia(station);
        return;
      }
      const audio = audioRef.current;
      if (pendingCanplayRef.current) {
        audio.removeEventListener("canplay", pendingCanplayRef.current);
        pendingCanplayRef.current = null;
      }
      if (pendingClearCanplayRef.current) {
        audio.removeEventListener("canplay", pendingClearCanplayRef.current);
        pendingClearCanplayRef.current = null;
      }
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      stopSilentLoop();
      stopHeartbeat();
      releaseWakeLock();
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
      retryCountRef.current = 0;
      streamDeadRef.current = false;
      isPlayingRef.current = false;
      setState((s) => ({ ...s, currentStation: station, isBuffering: true, isPlaying: false }));
      const secureLogo = (_b = station.logo) == null ? void 0 : _b.replace("http://", "https://");
      updateMediaSession({ ...station, logo: secureLogo }, true);
      if ("vibrate" in navigator) navigator.vibrate(10);
      audio.src = station.streamUrl;
      audio.load();
      const startPlayback = () => {
        audio.play().then(() => {
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
          isPlayingRef.current = true;
          setState((s) => ({ ...s, isPlaying: true, isBuffering: false }));
          startSilentLoop();
          startHeartbeat();
          armPlayTracking(station);
        }).catch((e) => {
          console.error("[RadioSphere] Playback failed", e);
          stopSilentLoop();
          stopHeartbeat();
          releaseWakeLock();
          cancelPlayTracking();
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
          isPlayingRef.current = false;
          setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
          toast({ title: t("player.streamError"), description: t("player.streamErrorDesc"), variant: "destructive" });
        });
        audio.removeEventListener("canplay", startPlayback);
        pendingCanplayRef.current = null;
      };
      audio.addEventListener("canplay", startPlayback);
      pendingCanplayRef.current = startPlayback;
      const timeout = setTimeout(() => {
        audio.removeEventListener("canplay", startPlayback);
        pendingCanplayRef.current = null;
        pendingTimeoutRef.current = null;
        if (audio.readyState < 3) {
          console.warn("[RadioSphere] Stream timeout — no canplay after 15s");
          audio.pause();
          audio.removeAttribute("src");
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
          setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
          toast({ title: t("player.timeout"), description: t("player.timeoutDesc"), variant: "destructive" });
        }
      }, 15e3);
      pendingTimeoutRef.current = timeout;
      const clearTimeoutOnCanplay = () => {
        clearTimeout(timeout);
        pendingTimeoutRef.current = null;
        audio.removeEventListener("canplay", clearTimeoutOnCanplay);
        pendingClearCanplayRef.current = null;
      };
      audio.addEventListener("canplay", clearTimeoutOnCanplay);
      pendingClearCanplayRef.current = clearTimeoutOnCanplay;
      onStationPlay == null ? void 0 : onStationPlay(station);
      reportStationClick(station.id);
      requestWakeLock();
    } catch (e) {
      console.error("[RadioSphere] Unexpected error in play()", e);
      setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
      toast({ title: t("player.unexpectedError"), description: t("player.unexpectedErrorDesc"), variant: "destructive" });
    }
  }, [onStationPlay, requestWakeLock, releaseWakeLock, updateMediaSession, startHeartbeat, stopHeartbeat, isCasting, castLoadMedia, armPlayTracking, cancelPlayTracking]);
  const play = useCallback((station) => {
    playInternal(station, false);
  }, [playInternal]);
  const handleSSLAccept = useCallback(() => {
    if (sslWarning) {
      sslAcceptedUrls.current.add(sslWarning.station.streamUrl);
      setSslWarning(null);
      playInternal(sslWarning.station, true);
    }
  }, [sslWarning, playInternal]);
  const handleSSLCancel = useCallback(() => {
    setSslWarning(null);
  }, []);
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!state.currentStation) return;
    if (isCasting) {
      toggleCastPlayPause();
      if (state.isPlaying) {
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
        setState((s) => ({ ...s, isPlaying: false }));
        updateMediaSession(state.currentStation, false);
      } else {
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        setState((s) => ({ ...s, isPlaying: true }));
        updateMediaSession(state.currentStation, true);
      }
      return;
    }
    if (state.isPlaying) {
      isPlayingRef.current = false;
      pausedAtRef.current = Date.now();
      audio.pause();
      stopSilentLoop();
      stopHeartbeat();
      releaseWakeLock();
      cancelPlayTracking();
      retryCountRef.current = 0;
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
      setState((s) => ({ ...s, isPlaying: false }));
      updateMediaSession(state.currentStation, false);
    } else {
      retryCountRef.current = 0;
      streamDeadRef.current = false;
      audio.play().then(() => {
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        isPlayingRef.current = true;
        setState((s) => ({ ...s, isPlaying: true }));
        startSilentLoop();
        startHeartbeat();
        requestWakeLock();
        updateMediaSession(state.currentStation, true);
        if (state.currentStation) armPlayTracking(state.currentStation);
      }).catch(() => {
        console.log("[RadioSphere] togglePlay: play() failed, reloading stream");
        retryCountRef.current = 0;
        streamDeadRef.current = false;
        reloadStream();
      });
    }
  }, [state.isPlaying, state.currentStation, releaseWakeLock, requestWakeLock, updateMediaSession, startHeartbeat, stopHeartbeat, reloadStream, isCasting, toggleCastPlayPause, armPlayTracking, cancelPlayTracking]);
  const setVolume = useCallback((v) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState((s) => ({ ...s, volume: v }));
  }, []);
  const lastCastStationIdRef = useRef(null);
  const wasCastingRef = useRef(false);
  useEffect(() => {
    const audio = audioRef.current;
    if (isCasting && !wasCastingRef.current) {
      console.log("[RadioSphere] Cast connected — pausing local audio");
      audio.pause();
      stopSilentLoop();
      stopHeartbeat();
    } else if (!isCasting && wasCastingRef.current) {
      console.log("[RadioSphere] Cast disconnected — resuming local audio");
      if (state.isPlaying && state.currentStation) {
        reloadStreamRef.current();
      }
    }
    wasCastingRef.current = isCasting;
    if (isCasting && state.currentStation) {
      if (lastCastStationIdRef.current !== state.currentStation.id) {
        lastCastStationIdRef.current = state.currentStation.id;
        castLoadMedia(state.currentStation);
      }
    }
    if (!isCasting) {
      lastCastStationIdRef.current = null;
    }
  }, [isCasting, state.currentStation, state.isPlaying, castLoadMedia]);
  const openFullScreen = useCallback(() => setState((s) => ({ ...s, isFullScreen: true })), []);
  const closeFullScreen = useCallback(() => setState((s) => ({ ...s, isFullScreen: false })), []);
  return /* @__PURE__ */ jsxs(PlayerContext.Provider, { value: { ...state, play, togglePlay, setVolume, openFullScreen, closeFullScreen, isCastAvailable, isCasting, castDeviceName, castUiMode, castInitState, startCast, stopCast }, children: [
    children,
    /* @__PURE__ */ jsx(
      SSLWarningDialog,
      {
        open: !!sslWarning,
        stationName: (sslWarning == null ? void 0 : sslWarning.station.name) || "",
        onAcceptRisk: handleSSLAccept,
        onCancel: handleSSLCancel
      }
    )
  ] });
}
const StreamBufferContext = createContext(null);
function useStreamBuffer() {
  const ctx = useContext(StreamBufferContext);
  if (!ctx) throw new Error("useStreamBuffer must be inside StreamBufferProvider");
  return ctx;
}
const MAX_BUFFER_DURATION = 5 * 60;
const MAX_BUFFER_BYTES = 5 * 60 * 20 * 1024;
function StreamBufferProvider({ children }) {
  const { currentStation, isPlaying } = usePlayer();
  const { t } = useTranslation();
  const chunksRef = useRef([]);
  const totalBytesRef = useRef(0);
  const cumulativeBytesRef = useRef(0);
  const recordingStartIdxRef = useRef(-1);
  const recordingTimerRef = useRef(null);
  const seekBlobUrlRef = useRef(null);
  const stationIdRef = useRef(null);
  const fetchControllerRef = useRef(null);
  const bufferAvailableRef = useRef(false);
  const detectedMimeRef = useRef("audio/mpeg");
  const [bufferSeconds, setBufferSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [bufferAvailable, setBufferAvailable] = useState(false);
  const [recordingAvailable, setRecordingAvailable] = useState(false);
  const [currentSeekOffsetSeconds, setCurrentSeekOffsetSeconds] = useState(0);
  const clearBuffer = useCallback(() => {
    chunksRef.current = [];
    totalBytesRef.current = 0;
    cumulativeBytesRef.current = 0;
    setBufferSeconds(0);
    setIsRecording(false);
    setRecordingDuration(0);
    setIsLive(true);
    setCurrentSeekOffsetSeconds(0);
    setBufferAvailable(false);
    recordingStartIdxRef.current = -1;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    bufferAvailableRef.current = false;
    if (seekBlobUrlRef.current) {
      URL.revokeObjectURL(seekBlobUrlRef.current);
      seekBlobUrlRef.current = null;
    }
  }, []);
  const trimBuffer = useCallback(() => {
    while (totalBytesRef.current > MAX_BUFFER_BYTES && chunksRef.current.length > 0) {
      const removed = chunksRef.current.shift();
      totalBytesRef.current -= removed.data.byteLength;
      if (recordingStartIdxRef.current > 0) {
        recordingStartIdxRef.current--;
      } else if (recordingStartIdxRef.current === 0) {
        recordingStartIdxRef.current = 0;
      }
    }
  }, []);
  const updateBufferSeconds = useCallback(() => {
    const chunks = chunksRef.current;
    if (chunks.length < 2) {
      setBufferSeconds(0);
      return;
    }
    const duration = (chunks[chunks.length - 1].time - chunks[0].time) / 1e3;
    setBufferSeconds(Math.min(duration, MAX_BUFFER_DURATION));
  }, []);
  const stopFetch = useCallback(() => {
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
      fetchControllerRef.current = null;
    }
  }, []);
  const startFetch = useCallback(async (streamUrl) => {
    stopFetch();
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    console.log("[StreamBuffer] Connexion directe au flux (pas de proxy) :", streamUrl);
    try {
      const response = await fetch(streamUrl, {
        signal: controller.signal,
        headers: { "Accept": "*/*" }
      });
      if (!response.ok || !response.body) {
        console.error("[StreamBuffer] Échec du fetch direct. Status:", response.status);
        setBufferAvailable(false);
        setRecordingAvailable(false);
        return;
      }
      const contentType = response.headers.get("Content-Type") || "audio/mpeg";
      detectedMimeRef.current = contentType.split(";")[0].trim();
      console.log("[StreamBuffer] Flux connecté. MIME:", detectedMimeRef.current);
      const reader = response.body.getReader();
      const readLoop = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value || value.byteLength === 0) continue;
            const chunk = {
              data: value,
              time: Date.now(),
              byteOffset: cumulativeBytesRef.current
            };
            cumulativeBytesRef.current += value.byteLength;
            chunksRef.current.push(chunk);
            totalBytesRef.current += value.byteLength;
            if (!bufferAvailableRef.current) {
              bufferAvailableRef.current = true;
              setBufferAvailable(true);
            }
            trimBuffer();
            updateBufferSeconds();
          }
        } catch (err) {
        }
      };
      readLoop();
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("[StreamBuffer] Erreur lors du fetch direct :", e);
      }
      setBufferAvailable(false);
      setRecordingAvailable(false);
    }
  }, [stopFetch, trimBuffer, updateBufferSeconds]);
  useEffect(() => {
    const stationId = (currentStation == null ? void 0 : currentStation.id) ?? null;
    if (!(currentStation == null ? void 0 : currentStation.streamUrl)) {
      stopFetch();
      clearBuffer();
      stationIdRef.current = null;
      return;
    }
    if (stationId !== stationIdRef.current) {
      console.log("[StreamBuffer] Nouvelle station détectée, démarrage du fetch direct.");
      stationIdRef.current = stationId;
      clearBuffer();
      startFetch(currentStation.streamUrl);
    }
  }, [currentStation == null ? void 0 : currentStation.id, currentStation == null ? void 0 : currentStation.streamUrl, startFetch, stopFetch, clearBuffer]);
  useEffect(() => {
    return () => {
      if (seekBlobUrlRef.current) URL.revokeObjectURL(seekBlobUrlRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);
  const startRecording = useCallback(() => {
    if (!bufferAvailable || chunksRef.current.length === 0) return;
    if (!isLive && currentSeekOffsetSeconds > 0) {
      const now = Date.now();
      const targetTime = now - currentSeekOffsetSeconds * 1e3;
      let startIdx = 0;
      for (let i = 0; i < chunksRef.current.length; i++) {
        if (chunksRef.current[i].time >= targetTime) {
          startIdx = i;
          break;
        }
      }
      recordingStartIdxRef.current = startIdx;
    } else {
      recordingStartIdxRef.current = chunksRef.current.length - 1;
    }
    setIsRecording(true);
    setRecordingDuration(0);
    const startTime = Date.now();
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTime) / 1e3));
    }, 1e3);
    toast$1.success(t("player.recordingStarted"));
  }, [t, bufferAvailable, isLive, currentSeekOffsetSeconds]);
  const stopRecording = useCallback(async () => {
    if (!isRecording) return null;
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingStartIdxRef.current < 0) return null;
    const chunks = chunksRef.current;
    const startIdx = Math.max(0, recordingStartIdxRef.current);
    const recordedChunks = chunks.slice(startIdx);
    recordingStartIdxRef.current = -1;
    if (recordedChunks.length === 0) return null;
    const parts = [];
    for (const c of recordedChunks) parts.push(new Uint8Array(c.data));
    const mime = detectedMimeRef.current;
    const blob = new Blob(parts, { type: mime });
    let ext = "mp3";
    if (mime.includes("aac") || mime.includes("mp4")) ext = "aac";
    else if (mime.includes("ogg")) ext = "ogg";
    else if (mime.includes("flac")) ext = "flac";
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, "0")}h${String(now.getMinutes()).padStart(2, "0")}`;
    const stationName = ((currentStation == null ? void 0 : currentStation.name) ?? "Station").replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").replace(/\s+/g, "_").slice(0, 40);
    const fileName = `RadioSphere_${stationName}_${dateStr}_${timeStr}.${ext}`;
    toast$1.success(t("player.recordingStopped"));
    setRecordingDuration(0);
    return { blob, fileName };
  }, [isRecording, currentStation == null ? void 0 : currentStation.name, t]);
  const returnToLiveInternal = useCallback(() => {
    if (seekBlobUrlRef.current) {
      URL.revokeObjectURL(seekBlobUrlRef.current);
      seekBlobUrlRef.current = null;
    }
    const streamUrl = currentStation == null ? void 0 : currentStation.streamUrl;
    if (streamUrl) {
      console.log("[StreamBuffer] Retour au direct via URL directe :", streamUrl);
      globalAudio.pause();
      globalAudio.src = streamUrl;
      globalAudio.load();
      globalAudio.play().catch(() => {
      });
    }
    setIsLive(true);
    setCurrentSeekOffsetSeconds(0);
  }, [currentStation == null ? void 0 : currentStation.streamUrl]);
  const seekBack = useCallback((seconds) => {
    if (seconds <= 0) {
      returnToLiveInternal();
      return;
    }
    const chunks = chunksRef.current;
    if (chunks.length < 2) return;
    const now = Date.now();
    const targetTime = now - seconds * 1e3;
    let startIdx = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].time >= targetTime) {
        startIdx = i;
        break;
      }
    }
    const selectedChunks = chunks.slice(startIdx);
    if (selectedChunks.length === 0) return;
    const parts = [];
    for (const c of selectedChunks) parts.push(new Uint8Array(c.data));
    const blob = new Blob(parts, { type: detectedMimeRef.current });
    if (seekBlobUrlRef.current) URL.revokeObjectURL(seekBlobUrlRef.current);
    const blobUrl = URL.createObjectURL(blob);
    seekBlobUrlRef.current = blobUrl;
    const actualOffset = (now - selectedChunks[0].time) / 1e3;
    setCurrentSeekOffsetSeconds(Math.round(actualOffset));
    globalAudio.pause();
    globalAudio.src = blobUrl;
    globalAudio.load();
    globalAudio.play().catch(() => {
    });
    setIsLive(false);
  }, [returnToLiveInternal]);
  const returnToLive = useCallback(() => {
    if (isLive) return;
    returnToLiveInternal();
  }, [isLive, returnToLiveInternal]);
  const canSeekBack = bufferAvailable && bufferSeconds > 2;
  useEffect(() => {
    setRecordingAvailable(bufferAvailable);
  }, [bufferAvailable]);
  useEffect(() => {
    const handleBlobEnded = () => {
      if (!isLive && seekBlobUrlRef.current && globalAudio.src.startsWith("blob:")) {
        returnToLiveInternal();
      }
    };
    const handleBlobError = () => {
      if (globalAudio.src && globalAudio.src.startsWith("blob:")) {
        returnToLiveInternal();
      }
    };
    globalAudio.addEventListener("ended", handleBlobEnded);
    globalAudio.addEventListener("error", handleBlobError);
    return () => {
      globalAudio.removeEventListener("ended", handleBlobEnded);
      globalAudio.removeEventListener("error", handleBlobError);
    };
  }, [isLive, returnToLiveInternal]);
  return /* @__PURE__ */ jsx(StreamBufferContext.Provider, { value: {
    bufferSeconds,
    isRecording,
    recordingDuration,
    isLive,
    canSeekBack,
    bufferAvailable,
    recordingAvailable,
    currentSeekOffsetSeconds,
    startRecording,
    stopRecording,
    seekBack,
    returnToLive
  }, children });
}
const radioSphereLogo = "/assets/new-radio-logo-BSl52gCq.png";
const AUTO_RECOVERY_KEY = "radiosphere_auto_recovery_attempted";
async function clearAllCachesAndReload$1() {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
  }
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
  }
  safeSessionRemove("radiosphere_crash_purge_pending");
  try {
    window.location.reload();
  } catch {
  }
}
class ErrorBoundary extends React__default.Component {
  constructor(props) {
    super(props);
    __publicField(this, "handleClearCache", async () => {
      this.setState({ clearing: true });
      await clearAllCachesAndReload$1();
    });
    __publicField(this, "handleOpenExternal", () => {
      const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
      openInExternalBrowser(url);
    });
    __publicField(this, "handleCopy", async () => {
      const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
      const ok = await copyToClipboard(url);
      if (ok) {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2e3);
      }
    });
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    var _a;
    console.error("[RadioSphere] ErrorBoundary caught:", error, info.componentStack);
    try {
      const w = window;
      (_a = w.umami) == null ? void 0 : _a.track("error-boundary", {
        webview: isInAppBrowser(),
        message: String((error == null ? void 0 : error.message) || "").slice(0, 200)
      });
    } catch {
    }
    const sessionTried = safeSessionGet(AUTO_RECOVERY_KEY) === "1";
    let localTried = false;
    try {
      localTried = localStorage.getItem(AUTO_RECOVERY_KEY) === "1";
    } catch {
    }
    if (!sessionTried && !localTried) {
      safeSessionSet(AUTO_RECOVERY_KEY, "1");
      try {
        localStorage.setItem(AUTO_RECOVERY_KEY, "1");
      } catch {
      }
      setTimeout(() => {
        try {
          localStorage.removeItem(AUTO_RECOVERY_KEY);
        } catch {
        }
      }, 6e4);
      console.warn("[RadioSphere] Attempting auto-recovery (clear caches + reload)");
      void clearAllCachesAndReload$1();
    } else {
      console.warn("[RadioSphere] Auto-recovery already attempted — showing manual UI");
    }
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    const inApp = isInAppBrowser();
    if (inApp) {
      return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center gap-5", children: [
        /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be", className: "w-16 h-16 object-contain rounded-2xl opacity-90" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 max-w-sm", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-heading font-bold", children: "RadioSphere.be" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Le navigateur intégré ne supporte pas tout le site. Ouvrez‑le dans votre navigateur habituel pour profiter pleinement de la radio." }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80", children: "This in-app browser is limited. Open the site in your regular browser for the full experience." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2 w-full max-w-xs", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: this.handleOpenExternal,
              className: "flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity",
              "data-umami-event": "error-open-external",
              children: "Ouvrir dans le navigateur"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: this.handleCopy,
              className: "flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border hover:opacity-90 transition-opacity",
              "data-umami-event": "error-copy-link",
              children: this.state.copied ? "✓ Copié" : "Copier le lien"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => window.location.reload(),
            className: "text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline",
            children: "Réessayer / Try again"
          }
        )
      ] });
    }
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8 text-center gap-6", children: [
      /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be", className: "w-16 h-16 object-contain rounded-2xl opacity-80" }),
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-heading font-bold", children: "Something went wrong" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground max-w-sm", children: "An unexpected error occurred. Please reload the page to continue." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => window.location.reload(),
            className: "px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity",
            children: "Reload"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: this.handleClearCache,
            disabled: this.state.clearing,
            className: "px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border hover:opacity-90 transition-opacity disabled:opacity-50",
            children: this.state.clearing ? "Clearing…" : "Clear cache & reload"
          }
        )
      ] })
    ] });
  }
}
const SLEEP_TIMER_OPTIONS = [
  { minutes: 15 },
  { minutes: 30 },
  { minutes: 45 },
  { minutes: 60 },
  { minutes: 90 },
  { minutes: 120 }
];
const SleepTimerContext = createContext(null);
function useSleepTimer() {
  const ctx = useContext(SleepTimerContext);
  if (!ctx) throw new Error("useSleepTimer must be inside SleepTimerProvider");
  return ctx;
}
function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return "0:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function SleepTimerProvider({ children }) {
  const { togglePlay, isPlaying } = usePlayer();
  const { t } = useTranslation();
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef(null);
  const wasActiveRef = useRef(false);
  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  const cancelTimer = useCallback(() => {
    clearInterval_();
    wasActiveRef.current = false;
    setRemainingSeconds(0);
  }, [clearInterval_]);
  const startTimer = useCallback((minutes) => {
    clearInterval_();
    const totalSeconds = minutes * 60;
    setRemainingSeconds(totalSeconds);
    wasActiveRef.current = true;
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval_();
          return 0;
        }
        return prev - 1;
      });
    }, 1e3);
  }, [clearInterval_]);
  useEffect(() => {
    if (remainingSeconds === 0 && wasActiveRef.current) {
      wasActiveRef.current = false;
      if (isPlaying) {
        togglePlay();
      }
      toast({
        title: "💤 " + t("sleepTimer.title"),
        description: t("sleepTimer.stopped")
      });
    }
  }, [remainingSeconds, isPlaying, togglePlay]);
  useEffect(() => {
    return () => clearInterval_();
  }, [clearInterval_]);
  const formattedTime = formatTime(remainingSeconds);
  const isActive = remainingSeconds > 0;
  return /* @__PURE__ */ jsx(SleepTimerContext.Provider, { value: { remainingSeconds, isActive, startTimer, cancelTimer, formattedTime }, children });
}
const tabConfig = [
  { id: "home", labelKey: "nav.home", icon: Home },
  { id: "search", labelKey: "nav.explore", icon: Compass },
  { id: "library", labelKey: "nav.favorites", icon: Heart },
  { id: "about", labelKey: "nav.about", icon: Info }
];
function BottomNav({ activeTab, onTabChange }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsx("nav", { role: "navigation", "aria-label": t("nav.home"), className: "fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-secondary/60 backdrop-blur-lg border-t border-border px-2 py-1 pb-[env(safe-area-inset-bottom)] lg:hidden", children: tabConfig.map(({ id, labelKey, icon: Icon }) => /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => onTabChange(id),
      className: cn(
        "flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors min-w-[60px]",
        activeTab === id ? "text-primary" : "text-muted-foreground"
      ),
      children: [
        /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }),
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-medium relative", children: [
          t(labelKey),
          activeTab === id && /* @__PURE__ */ jsx("span", { className: "absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-[2px] rounded-full bg-primary shadow-[0_0_6px_2px_hsl(var(--primary)/0.6),0_0_12px_4px_hsl(var(--primary)/0.3)]" })
        ] })
      ]
    },
    id
  )) });
}
const sizeConfig = {
  small: { bars: 30, height: 32, gap: 2, barWidth: 6 },
  medium: { bars: 30, height: 48, gap: 2, barWidth: 6 },
  large: { bars: 30, height: 80, gap: 3, barWidth: 8 }
};
const barAnimations = [
  { duration: "0.45s", delay: "0s" },
  { duration: "0.55s", delay: "0.1s" },
  { duration: "0.4s", delay: "0.2s" },
  { duration: "0.6s", delay: "0.05s" },
  { duration: "0.5s", delay: "0.15s" },
  { duration: "0.65s", delay: "0.08s" },
  { duration: "0.42s", delay: "0.22s" },
  { duration: "0.58s", delay: "0.12s" },
  { duration: "0.48s", delay: "0.18s" }
];
function AudioVisualizer({ size = "small", active = true, className }) {
  const { bars, height, gap, barWidth } = sizeConfig[size];
  const [isMobile, setIsMobile] = useState(false);
  const visibleBars = isMobile ? 5 : bars;
  const totalWidth = visibleBars * barWidth + (visibleBars - 1) * gap;
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const updateMobileState = () => setIsMobile(query.matches);
    updateMobileState();
    query.addEventListener("change", updateMobileState);
    return () => query.removeEventListener("change", updateMobileState);
  }, []);
  const instanceAnimations = useMemo(
    () => Array.from({ length: visibleBars }, (_, i) => {
      const base = barAnimations[i % barAnimations.length];
      const variance = Math.random() * 0.28 - 0.14;
      const duration = `${Math.max(0.28, parseFloat(base.duration) + variance).toFixed(2)}s`;
      const delay = `${(Math.random() * 0.36).toFixed(2)}s`;
      const minScale = (0.12 + Math.random() * 0.36).toFixed(2);
      return { duration, delay, minScale };
    }),
    [visibleBars]
  );
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-end justify-center", className), style: { height, width: totalWidth, gap }, children: [
    Array.from({ length: visibleBars }).map((_, i) => /* @__PURE__ */ jsx(
      "span",
      {
        className: "rounded-full transition-transform duration-200",
        style: {
          width: barWidth,
          height: "100%",
          background: "linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary-glow)))",
          animation: active ? `equalizer-bar ${instanceAnimations[i].duration} ease-in-out ${instanceAnimations[i].delay} infinite alternate` : "none",
          opacity: active ? 1 : 0.55,
          transform: active ? void 0 : "scaleY(0.12)",
          transformOrigin: "bottom",
          ["--bar-min-scale"]: instanceAnimations[i].minScale
        }
      },
      i
    )),
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes equalizer-bar {
          0% { transform: scaleY(var(--bar-min-scale)); }
          100% { transform: scaleY(1); }
        }
      ` })
  ] });
}
const stationPlaceholder = "/assets/station-placeholder-C1MFh5kn.png";
const MARQUEE_SPEED$1 = 40;
function MiniPlayer() {
  const { currentStation, isPlaying, isBuffering, togglePlay, openFullScreen, isCasting, castDeviceName } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const { t } = useTranslation();
  const textContainerRef = useRef(null);
  const measureRef = useRef(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [marqueeDuration, setMarqueeDuration] = useState(10);
  useEffect(() => {
    const container = textContainerRef.current;
    if (!container) return;
    const check = () => {
      if (measureRef.current && container) {
        const textWidth = measureRef.current.scrollWidth;
        const containerWidth = container.clientWidth;
        const overflow = textWidth > containerWidth;
        setNeedsMarquee(overflow);
        if (overflow) {
          setMarqueeDuration(textWidth / MARQUEE_SPEED$1);
        }
      }
    };
    const observer = new ResizeObserver(check);
    observer.observe(container);
    check();
    return () => {
      observer.disconnect();
    };
  }, [currentStation == null ? void 0 : currentStation.name]);
  if (!currentStation) return null;
  const fav = isFavorite(currentStation.id);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "fixed left-0 right-0 z-30 flex items-center gap-3 px-4 py-2 bg-secondary/80 backdrop-blur-lg border-t border-border cursor-pointer lg:hidden",
      style: { bottom: "calc(56px + env(safe-area-inset-bottom, 0px))" },
      onClick: openFullScreen,
      children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-md bg-accent flex items-center justify-center overflow-hidden flex-shrink-0", style: { boxShadow: "0 4px 15px -3px hsla(250, 80%, 50%, 0.4), 0 2px 8px -2px hsla(220, 90%, 60%, 0.25)" }, children: currentStation.logo ? /* @__PURE__ */ jsx("img", { src: currentStation.logo.replace("http://", "https://"), alt: currentStation.name, loading: "lazy", className: "w-full h-full object-cover", onError: (e) => {
          e.target.src = stationPlaceholder;
        } }) : /* @__PURE__ */ jsx("img", { src: stationPlaceholder, alt: currentStation.name, className: "w-full h-full object-cover" }) }),
        isPlaying && /* @__PURE__ */ jsx(AudioVisualizer, { size: "medium" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("span", { ref: measureRef, className: "text-lg font-heading font-bold whitespace-nowrap absolute invisible pointer-events-none", children: currentStation.name }),
          /* @__PURE__ */ jsx("div", { ref: textContainerRef, className: "overflow-hidden", children: /* @__PURE__ */ jsx(
            "p",
            {
              className: `text-lg font-heading font-bold bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent whitespace-nowrap ${needsMarquee ? "w-fit animate-marquee" : ""}`,
              style: needsMarquee ? { animationDuration: `${marqueeDuration}s` } : void 0,
              children: needsMarquee ? /* @__PURE__ */ jsxs(Fragment, { children: [
                currentStation.name,
                "   •   ",
                currentStation.name,
                "   •   "
              ] }) : currentStation.name
            }
          ) }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground truncate flex items-center gap-1", children: [
            isCasting && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Cast, { className: "w-3 h-3 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "text-primary font-medium", children: castDeviceName || "Cast" }),
              /* @__PURE__ */ jsx("span", { children: "•" })
            ] }),
            currentStation.tags.length > 0 ? currentStation.tags.slice(0, 2).join(" • ") : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              toggleFavorite(currentStation);
            },
            "aria-label": fav ? t("aria.removeFavorite") : t("aria.addFavorite"),
            className: "w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors flex-shrink-0",
            children: /* @__PURE__ */ jsx(Heart, { className: `w-4 h-4 ${fav ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : ""}` })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              togglePlay();
            },
            "data-umami-event": "play-clicked",
            "aria-label": isPlaying ? t("aria.pause") : t("aria.play"),
            className: `w-11 h-11 rounded-full bg-gradient-to-b from-primary to-primary/80 border-t border-white/20 flex items-center justify-center text-primary-foreground active:shadow-sm active:translate-y-0.5 transition-all flex-shrink-0 ${isPlaying ? "animate-play-breathe" : "shadow-lg shadow-primary/50"}`,
            children: isBuffering ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : isPlaying ? /* @__PURE__ */ jsx(Pause, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Play, { className: "w-5 h-5 ml-0.5" })
          }
        )
      ]
    }
  );
}
function CastButton({ className = "" }) {
  const { isCastAvailable, isCasting, castUiMode, castInitState, startCast, stopCast } = usePlayer();
  const { t } = useTranslation();
  const launcherRef = useRef(null);
  const [launcherReady, setLauncherReady] = useState(false);
  useEffect(() => {
    if (castUiMode !== "launcher") return;
    const checkLauncher = () => {
      const isRegistered = !!customElements.get("google-cast-launcher");
      setLauncherReady(isRegistered);
    };
    checkLauncher();
    const t1 = setTimeout(checkLauncher, 2e3);
    const t2 = setTimeout(checkLauncher, 5e3);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [castUiMode]);
  useEffect(() => {
    if (castUiMode !== "launcher" || !launcherReady) return;
    const el = launcherRef.current;
    if (!el) return;
    const style = document.createElement("style");
    style.textContent = `
      :host { display: flex; align-items: center; justify-content: center; }
      button { width: 24px; height: 24px; }
      .casticon { fill: currentColor; }
    `;
    const tryInject = () => {
      if (el.shadowRoot && !el.shadowRoot.querySelector("style[data-rs]")) {
        style.setAttribute("data-rs", "1");
        el.shadowRoot.appendChild(style);
      }
    };
    tryInject();
    const mo = new MutationObserver(tryInject);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [castUiMode, launcherReady]);
  const baseClass = `w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isCasting ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"} ${className}`;
  if (castInitState === "initializing") {
    return /* @__PURE__ */ jsx("div", { className: `${baseClass} opacity-50 cursor-wait`, "aria-label": "Cast loading...", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) });
  }
  if (castUiMode === "native" && castInitState === "ready") {
    return /* @__PURE__ */ jsx(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          isCasting ? stopCast() : startCast();
        },
        className: baseClass,
        "aria-label": isCasting ? "Stop casting" : "Cast",
        children: /* @__PURE__ */ jsx(Cast, { className: `w-5 h-5 ${isCasting ? "animate-pulse" : ""}` })
      }
    );
  }
  if (castUiMode === "launcher" && launcherReady) {
    return /* @__PURE__ */ jsx("div", { className: baseClass, children: /* @__PURE__ */ jsx(
      "google-cast-launcher",
      {
        ref: launcherRef,
        style: {
          display: "inline-flex",
          width: 24,
          height: 24,
          cursor: "pointer",
          opacity: isCastAvailable ? 1 : 0.5,
          color: "currentColor",
          ["--connected-color"]: "hsl(var(--primary))",
          ["--disconnected-color"]: "currentColor"
        }
      }
    ) });
  }
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          toast({
            title: "Chromecast",
            description: t("cast.unsupportedBrowser")
          });
        },
        className: `${baseClass} opacity-50 cursor-help`,
        "aria-label": "Chromecast",
        children: /* @__PURE__ */ jsx(Cast, { className: "w-5 h-5" })
      }
    ) }),
    /* @__PURE__ */ jsx(TooltipContent, { side: "bottom", children: /* @__PURE__ */ jsx("p", { className: "text-xs", children: t("cast.openInChrome") }) })
  ] }) });
}
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(void 0);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}
const STORAGE_KEY$2 = "radiosphere_tbm_quota";
const MAX_SECONDS = 600;
const WARNING_THRESHOLD = 480;
function getTodayKey() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function loadQuota() {
  try {
    const raw = safeGetItem(STORAGE_KEY$2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayKey()) return parsed;
    }
  } catch {
  }
  return { date: getTodayKey(), usedSeconds: 0 };
}
function saveQuota(data) {
  safeSetItem(STORAGE_KEY$2, JSON.stringify(data));
}
function useTBMQuota() {
  const isMobile = useIsMobile();
  const [usedSeconds, setUsedSeconds] = useState(() => loadQuota().usedSeconds);
  useEffect(() => {
    const current = loadQuota();
    setUsedSeconds(current.usedSeconds);
  }, []);
  const trackUsage = useCallback(() => {
    if (!isMobile) return;
    setUsedSeconds((prev) => {
      const next = prev + 1;
      saveQuota({ date: getTodayKey(), usedSeconds: next });
      return next;
    });
  }, [isMobile]);
  const canUseTBM = !isMobile || usedSeconds < MAX_SECONDS;
  const isWarning = isMobile && usedSeconds >= WARNING_THRESHOLD && usedSeconds < MAX_SECONDS;
  return {
    canUseTBM,
    usedSeconds,
    maxSeconds: MAX_SECONDS,
    isWarning,
    isMobile,
    trackUsage
  };
}
function TBMQuotaModal({ open, onClose, onReturnToLive }) {
  const { t } = useTranslation();
  if (!open) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 bg-black/70 backdrop-blur-md",
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-sm rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-6 space-y-5 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(35,80%,55%)] to-[hsl(25,70%,40%)] flex items-center justify-center shadow-lg shadow-[hsl(35,80%,55%)]/20", children: /* @__PURE__ */ jsx(Clock, { className: "w-7 h-7 text-white" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-center text-lg font-bold text-foreground leading-tight", children: t("tbmQuota.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground leading-relaxed", children: t("tbmQuota.description") }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "#",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-[hsl(35,80%,50%)] to-[hsl(25,70%,45%)] text-white shadow-lg shadow-[hsl(35,80%,50%)]/30 hover:shadow-[hsl(35,80%,50%)]/50 active:scale-[0.98]",
          children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
            t("tbmQuota.cta")
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onReturnToLive,
          className: "flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all border border-border/50 bg-accent/30 text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-[0.98]",
          children: [
            /* @__PURE__ */ jsx(Radio, { className: "w-4 h-4" }),
            t("tbmQuota.continueLive")
          ]
        }
      )
    ] })
  ] });
}
function CassetteAnimation({
  duration,
  maxDuration = 600,
  stationName = "RadioSphere",
  stationLogo,
  size = "small",
  isSpinning = true,
  isRecording = false
}) {
  const progress = Math.min(duration / maxDuration, 1);
  const leftSpeed = 2 + (1 - progress) * 3;
  const rightSpeed = 5 - progress * 3;
  const isLarge = size === "large";
  const bodyW = isLarge ? "w-80" : "w-56";
  const bodyH = isLarge ? "h-52" : "h-36";
  const reelSize = isLarge ? "w-14 h-14" : "w-10 h-10";
  const reelInner = isLarge ? "w-4 h-4" : "w-3 h-3";
  const windowTop = isLarge ? "top-[4.5rem]" : "top-14";
  const windowH = isLarge ? "h-20" : "h-14";
  const labelH = isLarge ? "h-12" : "h-8";
  const labelTop = isLarge ? "top-3" : "top-2";
  const labelFontSize = isLarge ? "text-xs" : "text-[10px]";
  const formatTime2 = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `relative ${bodyW} ${bodyH} rounded-xl overflow-hidden`,
        style: {
          background: "linear-gradient(180deg, hsl(30,40%,28%) 0%, hsl(25,35%,20%) 40%, hsl(25,30%,15%) 100%)",
          border: "2px solid hsl(30,30%,32%)",
          boxShadow: `
            inset 0 2px 4px rgba(255,220,150,0.12),
            inset 0 -3px 6px rgba(0,0,0,0.4),
            0 8px 32px rgba(0,0,0,0.6),
            0 2px 4px rgba(0,0,0,0.3)
          `
        },
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[hsla(35,60%,60%,0.25)] to-transparent" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[hsla(35,50%,50%,0.15)] via-transparent to-transparent" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-[hsla(35,50%,50%,0.1)] via-transparent to-[hsla(0,0%,0%,0.2)]" }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: `absolute ${labelTop} left-4 right-4 ${labelH} rounded flex items-center justify-center px-2`,
              style: {
                background: "linear-gradient(180deg, hsl(45,60%,88%) 0%, hsl(45,55%,80%) 100%)",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.2)"
              },
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-x-3 top-1 border-t border-[hsla(25,40%,40%,0.15)]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-x-3 bottom-1 border-b border-[hsla(25,40%,40%,0.15)]" }),
                /* @__PURE__ */ jsx("span", { className: `${labelFontSize} font-bold text-[hsl(25,40%,25%)] tracking-widest uppercase truncate relative z-10`, children: stationName })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: `absolute ${windowTop} left-6 right-6 ${windowH} rounded-lg flex items-center justify-between px-4 overflow-hidden`,
              style: {
                background: "linear-gradient(180deg, hsl(220,10%,6%) 0%, hsl(220,8%,10%) 50%, hsl(220,10%,7%) 100%)",
                border: "1.5px solid hsl(30,20%,30%)",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6), inset 0 -1px 3px rgba(0,0,0,0.3), 0 1px 0 hsla(30,30%,40%,0.3)"
              },
              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: `${reelSize} rounded-full flex items-center justify-center relative ${isSpinning ? "cassette-reel-spin" : ""}`,
                    style: {
                      animationDuration: isSpinning ? `${leftSpeed}s` : void 0,
                      background: "radial-gradient(circle, hsl(220,10%,14%) 30%, hsl(220,8%,10%) 100%)",
                      border: "2px solid hsl(30,25%,40%)",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px rgba(200,150,50,0.1)"
                    },
                    children: [
                      /* @__PURE__ */ jsx("div", { className: `${reelInner} rounded-full bg-[hsl(30,30%,42%)]`, style: { boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" } }),
                      [0, 60, 120, 180, 240, 300].map((deg) => /* @__PURE__ */ jsx("div", { className: "absolute w-[1.5px] bg-[hsl(30,20%,35%)]", style: { height: isLarge ? "10px" : "7px", transform: `rotate(${deg}deg)`, transformOrigin: "center center" } }, deg))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 mx-2 relative", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 -translate-y-[6px] inset-x-0 h-[1.5px] bg-gradient-to-r from-[hsl(25,50%,28%)] via-[hsl(25,40%,35%)] to-[hsl(25,50%,28%)]", style: { boxShadow: "0 1px 2px rgba(0,0,0,0.3)" } }),
                  /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 translate-y-[4px] inset-x-0 h-[1.5px] bg-gradient-to-r from-[hsl(25,50%,25%)] via-[hsl(25,35%,30%)] to-[hsl(25,50%,25%)]", style: { boxShadow: "0 1px 2px rgba(0,0,0,0.3)" } }),
                  isLarge && stationLogo && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full overflow-hidden border border-[hsl(30,20%,35%)] vintage-filter", style: { boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }, children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: stationLogo.replace("http://", "https://"),
                      alt: "",
                      className: "w-full h-full object-cover",
                      onError: (e) => {
                        e.target.src = stationPlaceholder;
                      }
                    }
                  ) }) })
                ] }),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: `${reelSize} rounded-full flex items-center justify-center relative ${isSpinning ? "cassette-reel-spin" : ""}`,
                    style: {
                      animationDuration: isSpinning ? `${rightSpeed}s` : void 0,
                      background: "radial-gradient(circle, hsl(220,10%,14%) 30%, hsl(220,8%,10%) 100%)",
                      border: "2px solid hsl(30,25%,40%)",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px rgba(200,150,50,0.1)"
                    },
                    children: [
                      /* @__PURE__ */ jsx("div", { className: `${reelInner} rounded-full bg-[hsl(30,30%,42%)]`, style: { boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" } }),
                      [0, 60, 120, 180, 240, 300].map((deg) => /* @__PURE__ */ jsx("div", { className: "absolute w-[1.5px] bg-[hsl(30,20%,35%)]", style: { height: isLarge ? "10px" : "7px", transform: `rotate(${deg}deg)`, transformOrigin: "center center" } }, deg))
                    ]
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[hsla(35,60%,70%,0.15)] to-transparent", style: { bottom: isLarge ? "2.5rem" : "1.75rem" } }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-2 left-6 w-2.5 h-2.5 rounded-full", style: { background: "radial-gradient(circle at 35% 35%, hsl(30,25%,50%), hsl(30,20%,30%))", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.3)" }, children: /* @__PURE__ */ jsx("div", { className: "absolute inset-[3px] border-t border-[hsla(30,10%,20%,0.5)]" }) }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-2 right-6 w-2.5 h-2.5 rounded-full", style: { background: "radial-gradient(circle at 35% 35%, hsl(30,25%,50%), hsl(30,20%,30%))", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.3)" }, children: /* @__PURE__ */ jsx("div", { className: "absolute inset-[3px] border-t border-[hsla(30,10%,20%,0.5)]" }) }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 -bottom-1 h-3 bg-gradient-to-t from-[hsla(0,0%,0%,0.4)] to-transparent rounded-b-xl" })
        ]
      }
    ),
    isRecording && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-red-500 rec-blink" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-mono font-bold text-red-400 tracking-wider", children: formatTime2(duration) }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
        "/ ",
        formatTime2(maxDuration)
      ] })
    ] })
  ] });
}
const MAX_BUFFER_DISPLAY = 5 * 60;
function TimebackMachine({ onClose, onRecordingResult }) {
  const { currentStation, isPlaying, togglePlay } = usePlayer();
  const { t } = useTranslation();
  const {
    bufferSeconds,
    isRecording,
    recordingDuration,
    isLive,
    bufferAvailable,
    currentSeekOffsetSeconds,
    startRecording,
    stopRecording,
    seekBack,
    returnToLive
  } = useStreamBuffer();
  const { canUseTBM, isWarning, trackUsage, isMobile: isMobileQuota } = useTBMQuota();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const warningShownRef = useRef(false);
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    if (isLive || !isMobileQuota) return;
    const interval = setInterval(() => {
      trackUsage();
    }, 1e3);
    return () => clearInterval(interval);
  }, [isLive, isMobileQuota, trackUsage]);
  useEffect(() => {
    if (isWarning && !warningShownRef.current) {
      warningShownRef.current = true;
      toast$1.info(t("tbmQuota.warning"), { duration: 5e3 });
    }
  }, [isWarning, t]);
  const handleRewind = () => {
    if (!canUseTBM) {
      setShowQuotaModal(true);
      return;
    }
    const totalBuffer2 = Math.floor(bufferSeconds);
    if (totalBuffer2 < 2) return;
    const newOffset = Math.min(currentSeekOffsetSeconds + 15, totalBuffer2);
    seekBack(newOffset);
  };
  const handleForward = () => {
    const newOffset = currentSeekOffsetSeconds - 15;
    if (newOffset <= 0) {
      returnToLive();
    } else {
      seekBack(newOffset);
    }
  };
  const handleRecToggle = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        onRecordingResult(result);
      }
    } else {
      startRecording();
    }
  };
  const handleStop = () => {
    if (isRecording) {
      handleRecToggle();
    } else if (!isLive) {
      returnToLive();
    }
  };
  const handleReturnToLive = () => {
    returnToLive();
    onClose();
  };
  const totalBuffer = Math.floor(bufferSeconds);
  const bufferFillPct = Math.min(totalBuffer / MAX_BUFFER_DISPLAY * 100, 100);
  const cursorPosInBuffer = isLive ? totalBuffer : Math.max(0, totalBuffer - currentSeekOffsetSeconds);
  const cursorPct = totalBuffer > 0 ? cursorPosInBuffer / MAX_BUFFER_DISPLAY * 100 : 0;
  const recStartPct = isRecording && recordingDuration > 0 ? Math.max(0, (cursorPosInBuffer - recordingDuration) / MAX_BUFFER_DISPLAY * 100) : 0;
  const formatTime2 = (s) => {
    const abs = Math.abs(Math.round(s));
    const m = Math.floor(abs / 60);
    const sec = abs % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };
  const seekFromPosition = useCallback((clientX) => {
    if (!canUseTBM) {
      setShowQuotaModal(true);
      return;
    }
    const el = timelineRef.current;
    if (!el || totalBuffer < 2) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const maxPct = bufferFillPct / 100;
    if (pct >= maxPct - 0.02) {
      returnToLive();
    } else if (pct <= maxPct) {
      const targetSeconds = pct * MAX_BUFFER_DISPLAY;
      const offset = totalBuffer - targetSeconds;
      if (offset <= 1) {
        returnToLive();
      } else {
        seekBack(Math.round(offset));
      }
    }
  }, [totalBuffer, bufferFillPct, seekBack, returnToLive, canUseTBM]);
  const handleTimelineClick = (e) => {
    seekFromPosition(e.clientX);
  };
  const handleTouchStart = (e) => {
    setIsDragging(true);
    seekFromPosition(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    seekFromPosition(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  if (!currentStation) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[55] bg-gradient-to-b from-[hsl(220,15%,6%)] via-[hsl(220,10%,8%)] to-[hsl(220,15%,4%)] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4", style: { paddingTop: "max(env(safe-area-inset-top, 24px), 1.5rem)" }, children: [
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-2 -ml-2", children: /* @__PURE__ */ jsx(ChevronDown, { className: "w-6 h-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-[hsl(35,80%,55%)] to-[hsl(25,70%,45%)]", style: { fontFamily: "'Poppins', sans-serif" }, children: "Timeback Machine" }),
      /* @__PURE__ */ jsx("div", { className: "w-10" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center gap-6 px-6", children: [
      /* @__PURE__ */ jsx(
        CassetteAnimation,
        {
          duration: isRecording ? recordingDuration : Math.floor(bufferSeconds),
          maxDuration: isRecording ? 600 : 300,
          stationName: currentStation.name,
          stationLogo: currentStation.logo,
          size: "large",
          isSpinning: isPlaying && (!isLive || isRecording),
          isRecording
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground font-mono", children: [
        /* @__PURE__ */ jsx("span", { className: `w-2 h-2 rounded-full ${totalBuffer > 2 ? "bg-green-500" : "bg-yellow-500 animate-pulse"}` }),
        totalBuffer > 2 ? `Buffer: ${formatTime2(totalBuffer)} / 5:00` : t("player.bufferLoading") || "Chargement du buffer..."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-lg bg-accent/30 border border-border/50 px-3 py-2 space-y-1", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-mono text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "text-foreground/60", children: "Status:" }),
          " ",
          bufferAvailable ? "✅ Active" : "❌ Inactive",
          " |",
          /* @__PURE__ */ jsx("span", { className: "text-foreground/60", children: " Live:" }),
          " ",
          isLive ? "🟢" : "🔴",
          " |",
          /* @__PURE__ */ jsx("span", { className: "text-foreground/60", children: " Seek:" }),
          " ",
          currentSeekOffsetSeconds,
          "s"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-mono text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "text-foreground/60", children: "Buffer:" }),
          " ",
          formatTime2(totalBuffer),
          " / 5:00 |",
          /* @__PURE__ */ jsx("span", { className: "text-foreground/60", children: " Rec:" }),
          " ",
          isRecording ? `🔴 ${formatTime2(recordingDuration)}` : "Off"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleRewind,
            disabled: totalBuffer < 2,
            className: "transport-btn w-12 h-12 rounded-lg bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border border-[hsl(0,0%,28%)] flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all disabled:opacity-30",
            children: /* @__PURE__ */ jsx(Rewind, { className: "w-5 h-5 text-foreground rtl-flip" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: togglePlay,
            className: "transport-btn w-14 h-14 rounded-lg bg-gradient-to-b from-[hsl(0,0%,25%)] to-[hsl(0,0%,15%)] border border-[hsl(0,0%,30%)] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.6)] active:translate-y-0.5 transition-all",
            children: isPlaying ? /* @__PURE__ */ jsx(Pause, { className: "w-6 h-6 text-foreground" }) : /* @__PURE__ */ jsx(Play, { className: "w-6 h-6 text-foreground ml-0.5" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleStop,
            className: "transport-btn w-12 h-12 rounded-lg bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border border-[hsl(0,0%,28%)] flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all",
            children: /* @__PURE__ */ jsx(Square, { className: "w-5 h-5 text-foreground" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleRecToggle,
            className: `transport-btn w-12 h-12 rounded-lg flex items-center justify-center border transition-all active:translate-y-0.5 ${isRecording ? "bg-gradient-to-b from-red-600 to-red-800 border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]" : "bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border-[hsl(0,0%,28%)] shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"} active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]`,
            children: /* @__PURE__ */ jsx(Circle, { className: `w-5 h-5 ${isRecording ? "text-white fill-white rec-blink" : "text-red-500 fill-red-500"}` })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleForward,
            disabled: isLive,
            className: "transport-btn w-12 h-12 rounded-lg bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border border-[hsl(0,0%,28%)] flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all disabled:opacity-30",
            children: /* @__PURE__ */ jsx(FastForward, { className: "w-5 h-5 text-foreground rtl-flip" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm space-y-2", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: timelineRef,
            "data-umami-event": "tbm-used",
            className: "relative h-4 rounded-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)] overflow-hidden cursor-pointer touch-none",
            onClick: handleTimelineClick,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-[hsl(0,0%,10%)]" }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute top-0 bottom-0 left-0 rounded-full bg-[hsl(0,0%,20%)] transition-all duration-1000 ease-linear",
                  style: { width: `${bufferFillPct}%` }
                }
              ),
              isRecording && recordingDuration > 0 && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute top-0 bottom-0 bg-red-500/30 rounded-full",
                  style: { left: `${recStartPct}%`, width: `${cursorPct - recStartPct}%` }
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-[hsl(35,80%,35%)] to-[hsl(35,80%,50%)] transition-all duration-300",
                  style: { width: `${cursorPct}%` }
                }
              ),
              totalBuffer > 1 && /* @__PURE__ */ jsx(
                "div",
                {
                  className: `absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[hsl(35,80%,55%)] border-2 border-[hsl(35,90%,70%)] shadow-[0_0_10px_rgba(200,150,50,0.6)] transition-all duration-300 ${isDragging ? "scale-125" : ""}`,
                  style: { left: `calc(${cursorPct}% - 10px)` }
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground font-mono", children: [
            "-",
            formatTime2(totalBuffer)
          ] }),
          !isLive && /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono font-bold text-[hsl(35,80%,55%)]", children: [
            "-",
            formatTime2(currentSeekOffsetSeconds)
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleReturnToLive,
              className: `flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isLive ? "text-green-400 live-pulse" : "text-muted-foreground bg-accent hover:text-green-400"}`,
              children: [
                /* @__PURE__ */ jsx(Radio, { className: "w-3 h-3" }),
                t("player.live")
              ]
            }
          )
        ] }),
        isRecording && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 pt-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-red-500 rec-blink" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-mono font-bold text-red-400 tracking-wider", children: [
            "REC ",
            formatTime2(recordingDuration)
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-6 pb-[calc(max(env(safe-area-inset-bottom,16px),1rem)+1rem)]", children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => {
          if (!isLive) returnToLive();
          onClose();
        },
        className: "w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30 active:scale-[0.98]",
        children: t("player.returnToLive")
      }
    ) }),
    /* @__PURE__ */ jsx(
      TBMQuotaModal,
      {
        open: showQuotaModal,
        onClose: () => setShowQuotaModal(false),
        onReturnToLive: () => {
          setShowQuotaModal(false);
          returnToLive();
          onClose();
        }
      }
    )
  ] });
}
const Slider = React.forwardRef(({ className, orientation = "horizontal", ...props }, ref) => {
  const isVertical = orientation === "vertical";
  return /* @__PURE__ */ jsxs(
    SliderPrimitive.Root,
    {
      ref,
      orientation,
      className: cn(
        "relative flex touch-none select-none",
        isVertical ? "flex-col w-5 h-full items-center" : "w-full items-center",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(SliderPrimitive.Track, { className: cn(
          "relative grow overflow-hidden rounded-full bg-secondary",
          isVertical ? "w-2 h-full" : "h-2 w-full"
        ), children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: cn(
          "absolute bg-primary",
          isVertical ? "w-full" : "h-full"
        ) }) }),
        /* @__PURE__ */ jsx(SliderPrimitive.Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" })
      ]
    }
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;
const tbmLogo = "/assets/tbm-logo-C5UTD4c3.png";
const MARQUEE_SPEED = 40;
function FullScreenPlayer({ onTagClick }) {
  const { currentStation, isPlaying, isBuffering, togglePlay, volume, setVolume, isFullScreen, closeFullScreen, isCasting, castDeviceName } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const { t } = useTranslation();
  const { isRecording, isLive, bufferAvailable, recordingAvailable } = useStreamBuffer();
  const [showTimeback, setShowTimeback] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [lastRecording, setLastRecording] = useState(null);
  const textContainerRef = useRef(null);
  const measureRef = useRef(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [marqueeDuration, setMarqueeDuration] = useState(10);
  useEffect(() => {
    if (!isFullScreen) return;
    const container = textContainerRef.current;
    if (!container) return;
    let rafId = 0;
    const check = () => {
      if (measureRef.current) {
        const textWidth = measureRef.current.scrollWidth;
        const containerWidth = container.clientWidth;
        const overflow = textWidth > containerWidth;
        setNeedsMarquee(overflow);
        if (overflow) {
          setMarqueeDuration(textWidth / MARQUEE_SPEED);
        }
      }
    };
    const scheduleCheck = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(check);
    };
    const observer = new ResizeObserver(scheduleCheck);
    observer.observe(container);
    scheduleCheck();
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [currentStation == null ? void 0 : currentStation.name, isFullScreen, isPlaying]);
  if (!isFullScreen || !currentStation) return null;
  const fav = isFavorite(currentStation.id);
  const handleShare = async () => {
    const text = currentStation.homepage ? `${t("player.nowPlaying")}: ${currentStation.name} — ${currentStation.homepage}` : `${t("player.nowPlaying")}: ${currentStation.name}`;
    const shareData = {
      title: currentStation.name,
      text,
      ...currentStation.homepage ? { url: currentStation.homepage } : {}
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(text);
        toast$1.success("Lien copié !");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast$1.success("Lien copié !");
      } catch {
      }
    }
  };
  const handleOpenWebsite = async () => {
    if (!currentStation.homepage) return;
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: currentStation.homepage });
    } catch {
      window.open(currentStation.homepage, "_blank");
    }
  };
  const handleRecordingResult = (result) => {
    setLastRecording(result);
    setShowSaveSheet(true);
  };
  const handleExportRecording = async () => {
    if (!lastRecording) return;
    try {
      const { Share } = await import("@capacitor/share");
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(",")[1];
          const saved = await Filesystem.writeFile({
            path: lastRecording.fileName,
            data: base64,
            directory: Directory.Cache
          });
          await Share.share({
            title: lastRecording.fileName,
            url: saved.uri
          });
          setShowSaveSheet(false);
          setLastRecording(null);
        } catch (e) {
          console.error("[Export] failed:", e);
          toast$1.error(t("player.unexpectedError"));
        }
      };
      reader.onerror = () => {
        toast$1.error(t("player.unexpectedError"));
      };
      reader.readAsDataURL(lastRecording.blob);
    } catch {
      const url = URL.createObjectURL(lastRecording.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = lastRecording.fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast$1.success(t("player.fileSaved"));
      setShowSaveSheet(false);
      setLastRecording(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto animate-in slide-in-from-bottom duration-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative flex items-start justify-between px-4 pb-2", style: { paddingTop: "max(env(safe-area-inset-top, 24px), 1.5rem)" }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: closeFullScreen,
          "aria-label": t("aria.close") || "Close",
          className: "w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] flex items-center justify-center text-white shadow-lg shadow-primary/40 hover:scale-105 hover:shadow-xl hover:shadow-primary/60 transition-all",
          style: { boxShadow: "0 0 16px hsla(250, 80%, 50%, 0.45), 0 4px 14px -2px hsla(220, 90%, 60%, 0.35)" },
          children: /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "absolute left-1/2 top-[calc(max(env(safe-area-inset-top,24px),1.5rem)+0.75rem)] -translate-x-1/2 text-xs font-medium uppercase tracking-wider text-muted-foreground", children: t("player.nowPlaying") }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1 -mr-2", children: [
        /* @__PURE__ */ jsx(CastButton, {}),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
          /* @__PURE__ */ jsx("button", { onClick: handleShare, className: "p-2", children: /* @__PURE__ */ jsx(Share2, { className: "w-5 h-5 text-muted-foreground" }) }),
          currentStation.homepage && /* @__PURE__ */ jsx("button", { onClick: handleOpenWebsite, className: "w-9 h-9 rounded-full bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] flex items-center justify-center text-[10px] font-extrabold text-white shadow-md shadow-primary/30 hover:opacity-90 transition-opacity", children: "www" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center px-14", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: "aspect-square rounded-2xl bg-accent shadow-2xl flex items-center justify-center overflow-hidden w-full max-w-[225px]",
        style: { boxShadow: "0 20px 60px -10px hsla(250, 80%, 50%, 0.5), 0 10px 30px -5px hsla(220, 90%, 60%, 0.3)" },
        children: currentStation.logo ? /* @__PURE__ */ jsx("img", { src: currentStation.logo.replace("http://", "https://"), alt: currentStation.name, loading: "lazy", className: "w-full h-full object-cover", onError: (e) => {
          e.target.src = stationPlaceholder;
        } }) : /* @__PURE__ */ jsx("img", { src: stationPlaceholder, alt: currentStation.name, className: "w-full h-full object-cover" })
      }
    ) }),
    isCasting && castDeviceName && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 py-2", children: [
      /* @__PURE__ */ jsx(Cast, { className: "w-4 h-4 text-primary" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-primary font-medium", children: castDeviceName })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-1", children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: `flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${isPlaying ? "text-green-400 live-pulse" : "text-red-400"}`,
        style: {
          boxShadow: isPlaying ? "0 0 12px hsla(142, 71%, 45%, 0.4), 0 0 24px hsla(142, 71%, 45%, 0.2)" : "0 0 12px hsla(0, 71%, 45%, 0.4), 0 0 24px hsla(0, 71%, 45%, 0.2)"
        },
        children: [
          /* @__PURE__ */ jsx(Radio, { className: "w-3.5 h-3.5" }),
          t("player.live")
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "px-6 pb-[calc(max(env(safe-area-inset-bottom,16px),1rem)+6rem)] space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 text-center px-12", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 min-w-0", children: [
                /* @__PURE__ */ jsx("span", { ref: measureRef, className: "text-3xl sm:text-4xl font-heading font-bold whitespace-nowrap absolute invisible pointer-events-none", children: currentStation.name }),
                /* @__PURE__ */ jsx("div", { ref: textContainerRef, className: "overflow-hidden w-full min-w-0", children: /* @__PURE__ */ jsx(
                  "p",
                  {
                    className: `text-3xl sm:text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent whitespace-nowrap mx-auto ${needsMarquee ? "w-fit animate-marquee" : ""}`,
                    style: needsMarquee ? { animationDuration: `${marqueeDuration}s` } : void 0,
                    children: needsMarquee ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      currentStation.name,
                      "   •   ",
                      currentStation.name,
                      "   •   "
                    ] }) : currentStation.name
                  }
                ) }),
                /* @__PURE__ */ jsx(AudioVisualizer, { size: "medium", active: isPlaying })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: currentStation.tags.length > 0 ? currentStation.tags.slice(0, 2).join(" • ") : currentStation.country })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => toggleFavorite(currentStation),
                className: "absolute right-0 top-0 p-2 rounded-full hover:bg-accent transition-colors",
                children: /* @__PURE__ */ jsx(Heart, { className: `w-6 h-6 ${fav ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-muted-foreground"}` })
              }
            )
          ] }),
          currentStation.tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: currentStation.tags.slice(0, 4).map((tag, i) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (onTagClick) {
                  closeFullScreen();
                  onTagClick(tag);
                }
              },
              className: "px-3 py-1 rounded-full bg-accent text-xs text-foreground font-medium hover:bg-primary/20 active:bg-primary/30 transition-colors",
              children: tag
            },
            i
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-5", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowTimeback(true),
                className: `w-32 h-32 rounded-full flex items-center justify-center transition-all active:scale-95 overflow-hidden ${bufferAvailable ? "animate-tbm-glow" : "animate-tbm-glow-idle"}`,
                style: {
                  background: "hsl(0,0%,2%)",
                  border: "2px solid hsla(0,0%,10%,0.5)",
                  boxShadow: bufferAvailable ? void 0 : "0 0 6px hsla(0,0%,45%,0.1), 0 0 14px hsla(0,0%,40%,0.06), 0 2px 8px rgba(0,0,0,0.5)"
                },
                children: /* @__PURE__ */ jsx("img", { src: tbmLogo, alt: "Timeback Machine", className: "w-[92%] h-[92%] object-cover rounded-full" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: togglePlay,
                className: `w-16 h-16 rounded-full bg-gradient-to-b from-primary to-primary/80 border-t border-white/20 flex items-center justify-center text-primary-foreground active:shadow-sm active:translate-y-0.5 transition-all ${isPlaying ? "animate-play-breathe" : "shadow-lg shadow-primary/50"}`,
                children: isBuffering ? /* @__PURE__ */ jsx(Loader2, { className: "w-7 h-7 animate-spin" }) : isPlaying ? /* @__PURE__ */ jsx(Pause, { className: "w-7 h-7" }) : /* @__PURE__ */ jsx(Play, { className: "w-7 h-7 ml-1" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 pt-2 flex-shrink-0", style: { height: "160px" }, children: [
          /* @__PURE__ */ jsx(Volume2, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }),
          /* @__PURE__ */ jsx(
            Slider,
            {
              value: [volume * 100],
              onValueChange: ([v]) => setVolume(v / 100),
              max: 100,
              step: 1,
              orientation: "vertical",
              className: "h-full [&_[role=slider]]:bg-gradient-to-b [&_[role=slider]]:from-[hsl(220,90%,60%)] [&_[role=slider]]:to-[hsl(280,80%,60%)] [&_[role=slider]]:border-0 [&_.absolute]:bg-gradient-to-b [&_.absolute]:from-[hsl(220,90%,60%)] [&_.absolute]:to-[hsl(280,80%,60%)]"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3 py-4 px-4 rounded-xl bg-accent/50", children: !currentStation.codec && !(currentStation.bitrate > 0) && !currentStation.language ? /* @__PURE__ */ jsx("p", { className: "col-span-3 text-xs text-muted-foreground text-center", children: t("player.noStreamInfo") }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        currentStation.codec && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("player.codec") }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: currentStation.codec })
        ] }),
        currentStation.bitrate > 0 && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("player.bitrate") }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-foreground", children: [
            currentStation.bitrate,
            " kbps"
          ] })
        ] }),
        currentStation.language && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("player.language") }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: currentStation.language })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://play.google.com/store/apps/details?id=com.fhm.radiosphere",
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: () => umamiTrack$1("play-store-click", { location: "fullscreen-player" }),
          className: "inline-flex items-center justify-center rounded-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "aria-label": "Télécharger RadioSphere.be sur Google Play",
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png",
              alt: "Get it on Google Play",
              className: "h-24 w-auto",
              loading: "lazy"
            }
          )
        }
      ) })
    ] }),
    showTimeback && /* @__PURE__ */ jsx(
      TimebackMachine,
      {
        onClose: () => setShowTimeback(false),
        onRecordingResult: handleRecordingResult
      }
    ),
    showSaveSheet && lastRecording && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[60] bg-black/60 flex items-start justify-center", style: { paddingTop: "max(env(safe-area-inset-top, 24px), 2rem)" }, onClick: () => {
      setShowSaveSheet(false);
      setLastRecording(null);
    }, children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md mx-4 bg-card rounded-2xl p-6 space-y-4 animate-in slide-in-from-top", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground text-center", children: t("player.recordingStopped") }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center", children: lastRecording.fileName }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleExportRecording,
            className: "w-full py-3 rounded-xl bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] text-white font-semibold flex items-center justify-center gap-2",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-5 h-5" }),
              t("player.saveRecording")
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setShowSaveSheet(false);
              setLastRecording(null);
            },
            className: "w-full py-3 text-muted-foreground text-sm",
            children: t("common.cancel")
          }
        )
      ] })
    ] }) })
  ] });
}
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className), ...props });
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Description, { ref, className: cn("text-sm text-muted-foreground", className), ...props }));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
const podcastLogo = "/assets/podcastsphere-logo-DImQX8aU.png";
const googlePlayIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUcAAAFeCAMAAAAhTi0KAAAAV1BMVEVHcEyXjkXGejo0qFPqtAvmRDc1pl3bSEA0qFPfRj3kRDg0p1hhd8/5uAT6ugP5uQT6uwNChfTqQzU0qFP7vANFhd69VGc2nn47krKKZ6GWriz0kBTuZiW8jLn4AAAAEXRSTlMAFzPa/Ot5ZaqayEr5X76Q35iIObUAAAlhSURBVHja7Z2LdtpIEESReAvZmw5IK8X5/+9c5DipjRUwmurdM+2p+wn3dHWNxACrJVTVabc7HNbr88R6vT4cdqdTVa3Ew1T1aTcZnLFeX2VK5UNUk8PzHa4ua2n6aBIh8a5KTeXdUYTEj1jvThJ2y+J5CeuDTN60KJMcsLiItSrn31Q77MXFJtU4vyK9PhMcZPKV6nAm0Snoz5tRhbOc+WZU4aQUzMyICidxNcqku0YVDqHR2aQ0qnBojVqTVFPLJM07jSqcNN49Uqtw0qhnGt1ZH2p1jNbkw8tRJp2XowrHJ9UqnERO5wXo5eQtKqRaa5IsGZl0HkcVjss4qnBcxlGF89+Po15OPnx2VOEEOTsCsP4UhfNuHFXdDi2jwnGJtQrHJ9YqHCrWMslzGs6/UOGks7MbIvWsuIjWbPj7/IoKJ52qNbNuEqk1yVDbRDecZZLiZBM/sq3CYWpm4i3bKhyiZn4TqcKhPdp0ANKaTMTAtCRlkvWIbKtwKI84AKlwCI9EtnXfDx5/z7bWJOMRImWS9IgDkAqH8oglqcLhPSLbQJ+GLfOIA5DWJOMR2ZZJ0uN9kbp+8bhHLEkVDuURByAVDuFxnm29nEz1iGyrcEiPOADpCSfZI5akTJIekW0VDucRIlU4lEdkW4VDeMz8AITf98vfI7KtwuE84gCkwqE8QqQKh/KIJanCYTxiScok6RHZVuEQHufZ1svJmUcm27p+MWFpIrUmGY94SpRJ0iOWpAqH84hsq3Aoj8i2CofxiGxrTVIekW2ZhEdSpAoHHqklqcKBR4clWfjLSQPJ2daaZDziDZBMwiOZ7eILx4oQCZO5esSSLLtwDHgdgIr8NMwAne2SC8dAAdnGBfM8PeIAVGp1G3DJdqmFY94iCy0cA15LssjCMWeGc5kmDfhlu8DCMVBYtmEyP484AJVWOAZcl2Rpa9JAmUsSJnmPWpIoHMKjso3CYTwq27h+wXhUtunqhkcdgCY2z09VukctyR9821wuF5hc6lHZ/sHm8sp1JhM8SiSG8Sdf/qqTPGpJXjVeQIJJAwUfgDCMMPlULfWobM81Li0ck8i3gpmDQxDhMeYBiB/GxDVpoLwliYKhTRqInW3/YUTh5OTRuiHEMCYWjoHiso1h5E0aCJ1tXiO3Jq1ckbDoYNL+Z4Z8h5EqHANFLEkUTALPNeExQLbpYeRH0kDYAxA/jPxIGigm25sLwfMT4TF+tvlMI9u8x/giv6VnGiegivDozRBuGAFEEh7jLkkUjL9IA2GzzQ8jL9JA2AMQr5EXaSBMtnmLPJunLDxCZDCN4InwGHZJwqIbX+ocPIIhg2HkHxENhM02f9rhu8ZA2Gzzw8ivSMuBbshAI7ciLQ+GDAqGSraBsNnmh5E/RVpckfy7HZ7nCh5zYYgzjOCJ8BjjAJQwjMRAGgibbX4Y+YG0rOiGWBoxkPYpRSZYJAfSQNglyQ8jP5AGwi5JvmD4hxrLj26IMIzgL3iMnW1+GPlgGwibbX4Y+YdDy1VkCI0ItuXKkPNpZx5sA2GXJD+MfGMbCJttvmD4o7jlzJD7MGJBGgibbV4jvyANhM02b5FfkBZAZL4acbXUQNAlyVvkgccASzLDYUTRGIiY7W+XLHheWQS64eYwyiORbWjMhC8riyuSsOjNBh4DLMnshhGsLA7Du6sS8piebQyjPPLZvg6jPLIHoGkY5ZFlmDTKI03bv1yAzo9pdOPXr99f5JEexq8TL0i2ngsTGCeNE9838kgO48Tv2dZ7s+XDCCDyove4iwoGZJftTRSPyPSfs63PudKGcS5Sn7suGUYwOwDpHsCCgrm3JHUv5R4dLH6Ybd2TShrG+QFI9/b+TIuCeTDbuke6oGDuZVv3mm+cdpaK1D37lGHEkgT63seNglm6JPU9pPkwpmVb34ub6KAxNdv6nuasYLhsx//eMJ9pLtvFfo8dwxhFJMZxFWAYiSUZ/3c++NNOgCWJcVzl+TgdJdv4DewAmeayXdDvcvEFw2eb/524+MPIZ5v/jdzow8iL5FM9EWIY+SUZ7Hdd+dNOhCWJ5QjiZprPNn/kARllOla2XzWCuMPIZ5vvGBB+GHmR8f+nAgUTKtvQCOIOIy+S1wiCnnb4bMf/Xyn+3Q5/AIr/P2d8pvlsB/jfPeK0EyLbt/4tN+Yw8iL9/5c0fsHwS5L/n9y4w8gvSX4YQQHDSGSb+B/xMAXDZ5u3CArINC9y84xI36CAYaS/KQKLt4k7jPyS5OsFxC0YPtv8YgQZfA0m4wPQBhY/IO4w8tnmFyOIWzB8tnmLIG7B8CL5egHlDSOyzdcLKG8YIZK3COIWjH+28fSyWkx5wwhe6HoBGXwNJoNsp9YLiF0wfLa5xQgKzTREUhZBocMIXjZEvYByhxFLEvWSTsDTjn+2YTGZgFcl/HnBYkyl2EyD7bFe0fgXTEkWQenD2OyrlQfeF0PLsghKHsYtLNK4nnaKW4zAMdMFWgRlZnrb7Fe+eA1jmfUCShxGWPSjpNMOFmOOHltZ9PA49gXXC6Df7RRdL4DNtCzyHrtRi/En1DDK4i+KKJgj6iU3j22vxejgcexlkffYjVqMhEdkWhZ5j90oi3MShlGL0cHj2Msi77GLYhGRztHj2Gsx3uATFgwsZumx7bUYeY/dKIv3IIaxgE+wvD2OveqF99iOsvgR8TONT7Cy9tiNqhcHj22veuE9dqMWo4PHtpdFB49jr3rhPbaj6oXwiEzLIu+xG7UYHTy2vSzyHruxV73wHttei9HB49jLIu+xG7UYU5hlWhaTiDCMsIh6ydlj22sxEh5x2pFF3mPX64IEAU47qhfeYzvKIsdbwWgxkrRTwciig8e21ydYPLux12J0YC+LLuy3mVrEYgxBvVW9eFA1qhcXjlqMLuxl8TMuyAavGLUgPepFC9LDohYkvxgVbBeLCjbwuyChR8OUxahgu1lU0xS6GEHdyKILR12QcBpILUYX9rLoVNm6IOF0hlS9eFAd8/sFCb2GfHQxKtmyeDvZWowu1I0sOq1IWXRakbog4UG136pefLpGFyScRGoxOomURSeRuiDhJHKrenFqbVl0Yd9oMbpQN7LotSR1QcIp21qMXiMpiy7Ux60WowfVvtnKoo/J41YWPagWpLuRxXvUiPfdUVS7fDyU13xv750Wj3uN4sMqj81c5vbVoSZxCdVV5v7YNNs3mqtCOXzlHyUrOlXSiXMoAAAAAElFTkSuQmCC";
const navItems = [
  { id: "home", labelKey: "nav.home", icon: Home },
  { id: "search", labelKey: "nav.explore", icon: Compass },
  { id: "library", labelKey: "nav.favorites", icon: Heart },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
  { id: "about", labelKey: "nav.about", icon: Info }
];
const SIDEBAR_COLLAPSED_KEY = "radiosphere_sidebar_collapsed";
const TBM_TEASER_DISMISSED_KEY = "radiosphere_tbm_teaser_dismissed";
function readBool(key, fallback) {
  try {
    return localStorage.getItem(key) === "true" ? true : fallback;
  } catch {
    return fallback;
  }
}
function DesktopSidebar({ activeTab, onTabChange }) {
  const { t, language, setLanguage } = useTranslation();
  const currentLangOption = LANGUAGE_OPTIONS.find((o) => o.value === language) ?? LANGUAGE_OPTIONS[0];
  const [tbmModalOpen, setTbmModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tbmDismissed, setTbmDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setCollapsed(readBool(SIDEBAR_COLLAPSED_KEY, false));
    setTbmDismissed(readBool(TBM_TEASER_DISMISSED_KEY, false));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
    }
  }, [collapsed, hydrated]);
  const handleDismissTbm = () => {
    setTbmDismissed(true);
    try {
      localStorage.setItem(TBM_TEASER_DISMISSED_KEY, "true");
    } catch {
    }
  };
  const tbmSections = [
    { titleKey: "tbmModal.bufferTitle", descKey: "tbmModal.bufferDesc" },
    { titleKey: "tbmModal.rewindTitle", descKey: "tbmModal.rewindDesc" },
    { titleKey: "tbmModal.recordTitle", descKey: "tbmModal.recordDesc" },
    { titleKey: "tbmModal.iconTitle", descKey: "tbmModal.iconDesc" },
    { titleKey: "tbmModal.liveTitle", descKey: "tbmModal.liveDesc" }
  ];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "aside",
      {
        role: "navigation",
        "aria-label": t("nav.home"),
        className: cn(
          "hidden lg:flex flex-col h-full bg-sidebar border-r border-sidebar-border flex-shrink-0 transition-all duration-300 relative",
          collapsed ? "w-16" : "w-72"
        ),
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setCollapsed((c) => !c),
              className: "absolute top-1/2 -right-5 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-primary/25 border border-primary/50 shadow-lg shadow-primary/15 flex items-center justify-center text-primary hover:bg-primary/35 hover:border-primary/60 hover:shadow-primary/25 transition-all duration-200",
              title: collapsed ? "Expand" : "Collapse",
              children: collapsed ? /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5 rtl-flip" }) : /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3.5 h-3.5 rtl-flip" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col pt-8 pb-4", collapsed ? "px-3 items-center" : "px-6"), children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => onTabChange("home"),
                title: t("nav.home"),
                "aria-label": t("nav.home"),
                className: cn(
                  "flex items-center gap-3 rounded-xl hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  collapsed ? "justify-center" : ""
                ),
                children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: radioSphereLogo,
                      alt: "RadioSphere.be",
                      className: cn("rounded-xl mix-blend-screen animate-logo-glow flex-shrink-0 object-contain", collapsed ? "w-[60px] h-[60px]" : "w-16 h-16")
                    }
                  ),
                  !collapsed && /* @__PURE__ */ jsx("h1", { className: "text-xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: "RadioSphere.be" })
                ]
              }
            ),
            !collapsed && /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://play.google.com/store/apps/details?id=com.fhm.radiosphere",
                target: "_blank",
                rel: "noopener noreferrer",
                onClick: () => umamiTrack$1("play-store-click", { location: "sidebar-expanded" }),
                className: "block hover:opacity-90 transition-opacity mt-3 -ml-1",
                title: "Google Play",
                children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png",
                    alt: "Get it on Google Play",
                    className: "h-[4.5rem]"
                  }
                )
              }
            )
          ] }),
          !collapsed && /* @__PURE__ */ jsxs("div", { className: "px-5 pb-4 space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground leading-relaxed", children: t("sidebar.stationCount") }),
            !tbmDismissed && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-accent/60 p-2.5 space-y-1.5 relative", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleDismissTbm,
                  className: "absolute top-1.5 right-1.5 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                  title: "Fermer",
                  children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("img", { src: tbmLogo, alt: "TimeBack Machine", className: "w-5 h-5 rounded" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-foreground", children: "TimeBack Machine" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground leading-relaxed pr-4", children: t("sidebar.tbmTeaser") }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setTbmModalOpen(true),
                  className: "inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline",
                  children: [
                    /* @__PURE__ */ jsx(HelpCircle, { className: "w-3 h-3" }),
                    t("sidebar.tbmHowItWorks")
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("nav", { className: "px-3 space-y-1", children: navItems.map(({ id, labelKey, icon: Icon }) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => onTabChange(id),
              title: collapsed ? t(labelKey) : void 0,
              className: cn(
                "w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all",
                collapsed ? "justify-center px-0 py-3" : "px-4 py-3",
                activeTab === id ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)] shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              ),
              children: [
                /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5 flex-shrink-0" }),
                !collapsed && t(labelKey)
              ]
            },
            id
          )) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1" }),
          /* @__PURE__ */ jsxs("div", { className: cn("pb-6 pt-4 space-y-3", collapsed ? "px-2" : "px-4"), children: [
            !collapsed ? /* @__PURE__ */ jsxs(
              "a",
              {
                href: "https://podcast.radiosphere.be/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent/60 hover:bg-accent transition-colors group",
                children: [
                  /* @__PURE__ */ jsx("img", { src: podcastLogo, alt: "PodcastSphere", className: "w-9 h-9 rounded-lg flex-shrink-0", loading: "lazy", width: 36, height: 36 }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-base font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: "PodcastSphere" }),
                      /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground leading-tight block", children: "podcast.radiosphere.be" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground/70 italic leading-tight block", children: t("sidebar.podcastTeaser") })
                  ] })
                ]
              }
            ) : /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://podcast.radiosphere.be/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "flex justify-center",
                title: "PodcastSphere",
                children: /* @__PURE__ */ jsx("img", { src: podcastLogo, alt: "PodcastSphere", className: "w-10 h-10 rounded-lg", loading: "lazy", width: 40, height: 40 })
              }
            ),
            collapsed && /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://play.google.com/store/apps/details?id=com.fhm.radiosphere",
                target: "_blank",
                rel: "noopener noreferrer",
                onClick: () => umamiTrack$1("play-store-click", { location: "sidebar-collapsed" }),
                className: "flex justify-center",
                title: "Google Play",
                children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: googlePlayIcon,
                    alt: "Google Play",
                    className: "w-8 h-8 object-contain",
                    loading: "lazy",
                    width: 32,
                    height: 32
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs(Popover, { children: [
              /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: !collapsed ? /* @__PURE__ */ jsxs("button", { className: "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-accent/40 hover:bg-accent/70 transition-colors text-left", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: currentLangOption == null ? void 0 : currentLangOption.flagUrl,
                    alt: currentLangOption == null ? void 0 : currentLangOption.label,
                    className: "w-6 h-6 object-cover rounded-full flex-shrink-0 ring-1 ring-border/50"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-foreground flex-1", children: currentLangOption == null ? void 0 : currentLangOption.label }),
                /* @__PURE__ */ jsx(ChevronDown, { className: "w-3.5 h-3.5 text-muted-foreground flex-shrink-0" })
              ] }) : /* @__PURE__ */ jsx("button", { className: "flex justify-center w-full py-1", title: currentLangOption == null ? void 0 : currentLangOption.label, children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: currentLangOption == null ? void 0 : currentLangOption.flagUrl,
                  alt: currentLangOption == null ? void 0 : currentLangOption.label,
                  className: "w-7 h-7 object-cover rounded-full ring-2 ring-primary/50"
                }
              ) }) }),
              /* @__PURE__ */ jsx(PopoverContent, { side: "top", align: "start", className: "w-48 p-1.5 rounded-xl", children: /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: LANGUAGE_OPTIONS.map((opt) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setLanguage(opt.value),
                  className: cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                    language === opt.value ? "bg-primary/15 text-primary font-medium" : "text-foreground hover:bg-accent"
                  ),
                  children: [
                    /* @__PURE__ */ jsx("img", { src: opt.flagUrl, alt: opt.label, className: "w-5 h-5 object-cover rounded-full" }),
                    opt.label
                  ]
                },
                opt.value
              )) }) })
            ] }),
            !collapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: "mailto:info@radiosphere.be",
                  className: "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-sidebar-accent transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4" }),
                    "info@radiosphere.be"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 px-4 pt-1", children: [
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://www.facebook.com/profile.php?id=61575475057830",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-muted-foreground hover:text-primary transition-colors",
                    "aria-label": "Facebook",
                    children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://www.instagram.com/radiosphere.be/",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-muted-foreground hover:text-primary transition-colors",
                    "aria-label": "Instagram",
                    children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" }) })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://bsky.app/profile/radiospherebe.bsky.social",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-muted-foreground hover:text-primary transition-colors",
                    "aria-label": "Bluesky",
                    children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.673 3.563 6.691 3.21-4.476.726-8.056 2.525-4.174 7.07C6.72 24.438 10.16 21.086 12 18c1.84 3.086 5.147 6.376 8.859 2.527 3.882-4.545.302-6.344-4.174-7.07 3.018.353 5.906-.583 6.691-3.21.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" }) })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://www.tiktok.com/@radiosphere.be",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-muted-foreground hover:text-primary transition-colors",
                    "aria-label": "TikTok",
                    children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.65a8.16 8.16 0 0 0 4.77 1.52V6.73a4.85 4.85 0 0 1-1.84-.04Z" }) })
                  }
                )
              ] })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: tbmModalOpen, onOpenChange: setTbmModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-background border-border", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "text-lg font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("img", { src: tbmLogo, alt: "TBM", className: "w-6 h-6 rounded" }),
        t("tbmModal.title")
      ] }) }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: t("tbmModal.intro") }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4 mt-2", children: tbmSections.map(({ titleKey, descKey }) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-accent p-3.5", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-foreground mb-1", children: t(titleKey) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: t(descKey) })
      ] }, titleKey)) }),
      /* @__PURE__ */ jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", className: "w-full mt-2 text-xs", children: t("tbmModal.close") }) })
    ] }) })
  ] });
}
function DesktopPlayerBar() {
  const {
    currentStation,
    isPlaying,
    isBuffering,
    togglePlay,
    volume,
    setVolume,
    openFullScreen,
    isCasting,
    castDeviceName
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const { t } = useTranslation();
  if (!currentStation) {
    return /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center justify-center h-20 bg-secondary/60 backdrop-blur-lg border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Radio, { className: "w-5 h-5" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: t("player.selectStation") || "Sélectionnez une station pour commencer" })
    ] }) });
  }
  const fav = isFavorite(currentStation.id);
  return /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center h-20 bg-secondary/60 backdrop-blur-lg border-t border-border px-6 gap-6", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-center gap-4 w-80 flex-shrink-0 cursor-pointer group",
        onClick: openFullScreen,
        role: "button",
        "aria-label": t("aria.openFullPlayer") || "Open full player",
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-14 h-14 rounded-lg bg-accent overflow-hidden flex-shrink-0 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow",
              style: { boxShadow: "0 4px 20px -4px hsla(250, 80%, 50%, 0.4)" },
              children: currentStation.logo ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: currentStation.logo.replace("http://", "https://"),
                  alt: currentStation.name,
                  className: "w-full h-full object-cover",
                  onError: (e) => {
                    e.target.src = stationPlaceholder;
                  }
                }
              ) : /* @__PURE__ */ jsx("img", { src: stationPlaceholder, alt: currentStation.name, className: "w-full h-full object-cover" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent truncate group-hover:opacity-90 transition-opacity", children: currentStation.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: currentStation.tags.length > 0 ? currentStation.tags.slice(0, 2).join(" • ") : currentStation.country }),
            isCasting && castDeviceName && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-0.5", children: [
              /* @__PURE__ */ jsx(Cast, { className: "w-3 h-3 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-primary font-medium", children: castDeviceName })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                toggleFavorite(currentStation);
              },
              className: "p-2 rounded-full hover:bg-accent transition-colors flex-shrink-0",
              children: /* @__PURE__ */ jsx(Heart, { className: `w-5 h-5 ${fav ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-muted-foreground"}` })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center gap-1", children: [
      /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isPlaying ? "text-green-400 live-pulse" : "text-red-400"}`, children: [
        /* @__PURE__ */ jsx(Radio, { className: "w-3 h-3" }),
        t("player.live")
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        isPlaying && /* @__PURE__ */ jsx(AudioVisualizer, { size: "medium" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: togglePlay,
            "data-umami-event": "play-clicked",
            className: `w-12 h-12 rounded-full bg-gradient-to-b from-primary to-primary/80 border-t border-white/20 flex items-center justify-center text-primary-foreground transition-all ${isPlaying ? "animate-play-breathe" : "shadow-lg shadow-primary/50"}`,
            children: isBuffering ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : isPlaying ? /* @__PURE__ */ jsx(Pause, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Play, { className: "w-5 h-5 ml-0.5" })
          }
        ),
        isPlaying && /* @__PURE__ */ jsx(AudioVisualizer, { size: "medium" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 w-64 flex-shrink-0 justify-end", children: [
      /* @__PURE__ */ jsx(CastButton, {}),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: openFullScreen,
          "aria-label": t("aria.openFullPlayer") || "Open full player",
          className: "w-9 h-9 rounded-full bg-gradient-to-b from-primary to-primary/80 border-t border-white/20 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/40 hover:scale-105 hover:shadow-primary/60 transition-all flex-shrink-0",
          style: { boxShadow: "0 0 14px hsla(250, 80%, 50%, 0.45), 0 4px 12px -2px hsla(220, 90%, 60%, 0.35)" },
          children: /* @__PURE__ */ jsx(Maximize2, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-36", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setVolume(volume > 0 ? 0 : 0.7), className: "p-1 text-muted-foreground hover:text-foreground transition-colors", children: volume === 0 ? /* @__PURE__ */ jsx(VolumeX, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Volume2, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsx(
          Slider,
          {
            value: [volume * 100],
            onValueChange: ([v]) => setVolume(v / 100),
            max: 100,
            step: 1,
            className: "flex-1 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[hsl(var(--primary))] [&_[role=slider]]:to-[hsl(280,80%,60%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_.absolute]:bg-gradient-to-r [&_.absolute]:from-[hsl(var(--primary))] [&_.absolute]:to-[hsl(280,80%,60%)]"
          }
        )
      ] })
    ] })
  ] });
}
const COPYRIGHT_YEAR = 2026;
function Footer() {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxs("footer", { className: "hidden lg:flex items-center justify-between gap-4 px-6 py-2 border-t border-border bg-secondary/30 backdrop-blur-sm text-[10px] text-muted-foreground", children: [
    /* @__PURE__ */ jsxs("span", { children: [
      "© ",
      COPYRIGHT_YEAR,
      " RadioSphere.be — ",
      t("footer.createdBy").split("Franck Malherbe")[0],
      /* @__PURE__ */ jsx("a", { href: "https://franckmalherbe.be", target: "_blank", rel: "noopener noreferrer", className: "hover:text-primary transition-colors", children: "Franck Malherbe" }),
      t("footer.createdBy").split("Franck Malherbe")[1]
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxs("a", { href: "https://radiosphere.be/privacy-policy.html", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 hover:text-primary transition-colors", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3" }),
        t("settings.privacyPolicy")
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "https://www.radio-browser.info/", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 hover:text-primary transition-colors", children: [
        /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
        "Radio Browser"
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "mailto:info@radiosphere.be", className: "inline-flex items-center gap-1 hover:text-primary transition-colors", children: [
        /* @__PURE__ */ jsx(Mail, { className: "w-3 h-3" }),
        "info@radiosphere.be"
      ] })
    ] }),
    /* @__PURE__ */ jsx("span", { children: "radiosphere.be" })
  ] });
}
function SmartArtwork({
  originalUrl = "",
  alt,
  className
}) {
  const [src, setSrc] = useState(originalUrl || stationPlaceholder);
  return /* @__PURE__ */ jsx("div", { className: cn("relative overflow-hidden w-full h-full", className), children: /* @__PURE__ */ jsx(
    "img",
    {
      src,
      alt,
      loading: "lazy",
      className: "w-full h-full object-cover",
      onError: () => {
        if (src !== stationPlaceholder) {
          setSrc(stationPlaceholder);
        }
      }
    }
  ) });
}
const prefetchCache = /* @__PURE__ */ new Map();
const PREFETCH_TTL = 15e3;
const PREFETCH_DISABLED = typeof navigator !== "undefined" && isInAppBrowser();
function prefetchStream(station) {
  if (PREFETCH_DISABLED) return;
  if (!station.streamUrl) return;
  const id = station.id;
  if (prefetchCache.has(id)) return;
  let audio;
  try {
    audio = new Audio();
    audio.preload = "auto";
    audio.volume = 0;
    audio.muted = true;
    audio.src = station.streamUrl.replace("http://", "https://");
    audio.load();
  } catch {
    return;
  }
  const timer = setTimeout(() => {
    try {
      audio.src = "";
      audio.load();
    } catch {
    }
    prefetchCache.delete(id);
  }, PREFETCH_TTL);
  prefetchCache.set(id, { audio, timer });
}
function useStreamPrefetch() {
  const hoverTimerRef = useRef(null);
  const onHover = useCallback((station) => {
    if (PREFETCH_DISABLED) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      prefetchStream(station);
    }, 200);
  }, []);
  const onLeave = useCallback((_station) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);
  return { onHover, onLeave };
}
function StationCard({ station, isFavorite, onToggleFavorite, compact, viewMode }) {
  const { play, currentStation, isPlaying } = usePlayer();
  const { t } = useTranslation();
  const { onHover, onLeave } = useStreamPrefetch();
  const isActive = (currentStation == null ? void 0 : currentStation.id) === station.id;
  const favLabel = isFavorite ? t("aria.removeFavorite") : t("aria.addFavorite");
  const playLabel = isPlaying && isActive ? t("aria.pause") : t("aria.play");
  const prefetchProps = {
    onPointerEnter: () => onHover(station),
    onPointerLeave: () => onLeave(station)
  };
  const mode = viewMode ?? (compact ? "list" : void 0);
  if (mode === "small") {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => play(station),
        "aria-label": `${playLabel} ${station.name}`,
        ...prefetchProps,
        className: "relative flex flex-col items-center w-full p-1 rounded-lg transition-all duration-300 ease-out group hover:scale-105 hover:drop-shadow-[0_4px_12px_hsl(var(--primary)/0.3)]",
        children: [
          /* @__PURE__ */ jsxs("div", { className: cn("relative w-full aspect-square rounded-lg bg-accent overflow-hidden shadow-md", isActive && isPlaying && "animate-card-glow"), children: [
            /* @__PURE__ */ jsx(SmartArtwork, { stationId: station.id, originalUrl: station.logo, homepage: station.homepage, stationName: station.name, alt: `Écouter ${station.name} en direct sur RadioSphere.be` }),
            isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none", children: isPlaying ? /* @__PURE__ */ jsx(AudioVisualizer, { size: "small" }) : /* @__PURE__ */ jsx(Play, { className: "w-5 h-5 text-white" }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onToggleFavorite(station);
                },
                "aria-label": favLabel,
                className: "absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/30 backdrop-blur-sm z-10",
                children: /* @__PURE__ */ jsx(Heart, { className: cn("w-2.5 h-2.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80") })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-[10px] font-semibold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: station.name })
        ]
      }
    );
  }
  if (mode === "list") {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => play(station),
        "aria-label": `${playLabel} ${station.name}`,
        ...prefetchProps,
        className: cn(
          "flex items-center gap-3 w-full p-3 rounded-lg transition-colors",
          isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-accent"
        ),
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-md bg-accent flex items-center justify-center overflow-hidden flex-shrink-0", children: /* @__PURE__ */ jsx(SmartArtwork, { stationId: station.id, originalUrl: station.logo, homepage: station.homepage, stationName: station.name, alt: `Écouter ${station.name} en direct sur RadioSphere.be` }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 text-left", children: [
            /* @__PURE__ */ jsx("p", { className: cn("text-sm font-medium truncate", isActive && "text-primary"), children: station.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground truncate", children: [
              station.country,
              station.tags[0] ? ` • ${station.tags[0]}` : ""
            ] })
          ] }),
          isActive && isPlaying && /* @__PURE__ */ jsx(AudioVisualizer, { size: "small" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                onToggleFavorite(station);
              },
              "aria-label": favLabel,
              className: "p-1.5",
              children: /* @__PURE__ */ jsx(Heart, { className: cn("w-4 h-4", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-muted-foreground") })
            }
          )
        ]
      }
    );
  }
  if (mode === "medium") {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => play(station),
        "aria-label": `${playLabel} ${station.name}`,
        ...prefetchProps,
        className: "relative flex flex-col items-center w-full p-2 rounded-xl transition-colors group",
        children: [
          /* @__PURE__ */ jsxs("div", { className: cn("relative w-full aspect-square rounded-xl bg-accent overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow"), children: [
            /* @__PURE__ */ jsx(SmartArtwork, { stationId: station.id, originalUrl: station.logo, homepage: station.homepage, stationName: station.name, alt: `Écouter ${station.name} en direct sur RadioSphere.be` }),
            isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none", children: isPlaying ? /* @__PURE__ */ jsx(AudioVisualizer, { size: "small" }) : /* @__PURE__ */ jsx(Play, { className: "w-8 h-8 text-white" }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onToggleFavorite(station);
                },
                "aria-label": favLabel,
                className: "absolute top-1.5 right-1.5 p-1 rounded-full bg-black/30 backdrop-blur-sm z-10",
                children: /* @__PURE__ */ jsx(Heart, { className: cn("w-3.5 h-3.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80") })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-xs font-semibold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: station.name })
        ]
      }
    );
  }
  if (mode === "large") {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => play(station),
        "aria-label": `${playLabel} ${station.name}`,
        ...prefetchProps,
        className: "relative flex flex-col items-center w-full p-2 rounded-xl transition-colors group",
        children: [
          /* @__PURE__ */ jsxs("div", { className: cn("relative w-full aspect-square rounded-xl bg-accent overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow"), children: [
            /* @__PURE__ */ jsx(SmartArtwork, { stationId: station.id, originalUrl: station.logo, homepage: station.homepage, stationName: station.name, alt: `Écouter ${station.name} en direct sur RadioSphere.be` }),
            isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none", children: isPlaying ? /* @__PURE__ */ jsx(AudioVisualizer, { size: "small" }) : /* @__PURE__ */ jsx(Play, { className: "w-10 h-10 text-white" }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onToggleFavorite(station);
                },
                "aria-label": favLabel,
                className: "absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm z-10",
                children: /* @__PURE__ */ jsx(Heart, { className: cn("w-4 h-4", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80") })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-bold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: station.name }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground truncate w-full text-center", children: station.country })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => play(station),
      "aria-label": `${playLabel} ${station.name}`,
      ...prefetchProps,
      className: "relative flex flex-col items-center w-[7.5rem] flex-shrink-0 p-2 rounded-xl transition-all duration-300 ease-out group hover:scale-105 hover:drop-shadow-[0_4px_12px_hsl(var(--primary)/0.3)]",
      children: [
        /* @__PURE__ */ jsxs("div", { className: cn("relative w-[5.5rem] h-[5.5rem] rounded-xl bg-accent mb-1.5 overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow"), children: [
          /* @__PURE__ */ jsx(SmartArtwork, { stationId: station.id, originalUrl: station.logo, homepage: station.homepage, stationName: station.name, alt: `Écouter ${station.name} en direct sur RadioSphere.be` }),
          isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none", children: isPlaying ? /* @__PURE__ */ jsx(AudioVisualizer, { size: "small" }) : /* @__PURE__ */ jsx(Play, { className: "w-8 h-8 text-white" }) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                onToggleFavorite(station);
              },
              "aria-label": favLabel,
              className: "absolute top-1.5 right-1.5 p-1 rounded-full bg-black/30 backdrop-blur-sm z-10",
              children: /* @__PURE__ */ jsx(Heart, { className: cn("w-3.5 h-3.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80") })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-foreground truncate w-full text-center", children: station.name }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground truncate w-full text-center", children: station.country })
      ]
    }
  );
}
function ScrollableRow({ children }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const check = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    check();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [children]);
  const scroll = (dir) => {
    var _a;
    (_a = ref.current) == null ? void 0 : _a.scrollBy({ left: dir * 200, behavior: "smooth" });
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
    /* @__PURE__ */ jsx("div", { ref, className: "flex gap-2 overflow-x-auto pb-2 scrollbar-hide", children }),
    canLeft && /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => scroll(-1),
        className: cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10",
          "w-8 h-14 rounded-r-lg bg-black/50 border border-border/30 backdrop-blur-md",
          "flex items-center justify-center text-foreground",
          "hover:bg-black/70 transition-all shadow-lg"
        ),
        children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5" })
      }
    ),
    canRight && /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => scroll(1),
        className: cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10",
          "w-8 h-14 rounded-l-lg bg-black/50 border border-border/30 backdrop-blur-md",
          "flex items-center justify-center text-foreground",
          "hover:bg-black/70 transition-all shadow-lg"
        ),
        children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5" })
      }
    )
  ] });
}
const DISCOVERIES_KEY = "radioshere_weekly_discoveries";
const DISCOVERIES_HISTORY_KEY = "radioshere_discoveries_history";
function getMondayKey() {
  const now = /* @__PURE__ */ new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}
function loadHistory() {
  try {
    return JSON.parse(safeGetItem(DISCOVERIES_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveHistory(ids) {
  safeSetItem(DISCOVERIES_HISTORY_KEY, JSON.stringify(ids.slice(0, 10)));
}
function loadCached() {
  try {
    const raw = safeGetItem(DISCOVERIES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function analyzeFavorites(favorites) {
  const tagCount = {};
  const countryCount = {};
  for (const s of favorites) {
    for (const tag of s.tags) {
      const t = tag.toLowerCase();
      if (t) tagCount[t] = (tagCount[t] || 0) + 1;
    }
    if (s.country) countryCount[s.country] = (countryCount[s.country] || 0) + 1;
  }
  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map((e) => e[0]);
  const countries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
  return { tags, countries };
}
function useWeeklyDiscoveries(favorites) {
  const [weekKey, setWeekKey] = useState(null);
  const [cached, setCached] = useState(null);
  const profile = useMemo(() => analyzeFavorites(favorites), [favorites]);
  const [forceRefresh, setForceRefresh] = useState(0);
  useEffect(() => {
    setWeekKey(getMondayKey());
    setCached(loadCached());
  }, []);
  const needsFetch = !!weekKey && (!cached || cached.weekKey !== weekKey || forceRefresh > 0);
  const { data, isFetching } = useQuery({
    queryKey: ["weeklyDiscoveries", weekKey, profile.tags.join(","), profile.countries.join(","), forceRefresh],
    queryFn: async () => {
      try {
        if (favorites.length === 0) {
          const stations = await radioBrowserProvider.getTopStations(20);
          return pickThree(stations, []);
        }
        const history = loadHistory();
        const favoriteIds = new Set(favorites.map((f) => f.id));
        const exclude = /* @__PURE__ */ new Set([...history, ...favoriteIds]);
        const searches = [];
        for (const tag of profile.tags.slice(0, 3)) {
          searches.push(radioBrowserProvider.searchStations({ tag, limit: 15 }));
        }
        for (const country of profile.countries.slice(0, 2)) {
          searches.push(radioBrowserProvider.searchStations({ country, limit: 15 }));
        }
        const settled = await Promise.allSettled(searches);
        const all = [];
        for (const r of settled) {
          if (r.status === "fulfilled") all.push(...r.value);
        }
        const seen = /* @__PURE__ */ new Set();
        const candidates = all.filter((s) => {
          if (!s.id || seen.has(s.id) || exclude.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        return pickThree(candidates, Array.from(exclude));
      } catch (e) {
        console.warn("[useWeeklyDiscoveries] fetch failed, returning empty:", e);
        return [];
      }
    },
    enabled: needsFetch && favorites.length > 0,
    staleTime: forceRefresh > 0 ? 0 : Infinity
  });
  const [discoveries, setDiscoveries] = useState([]);
  useEffect(() => {
    if (cached && weekKey && cached.weekKey === weekKey) {
      setDiscoveries(cached.stations);
    }
  }, [cached, weekKey]);
  useEffect(() => {
    if (weekKey && data && data.length > 0) {
      setDiscoveries(data);
      safeSetItem(DISCOVERIES_KEY, JSON.stringify({ weekKey, stations: data }));
      const history = loadHistory();
      const newIds = data.map((s) => s.id);
      saveHistory([...newIds, ...history]);
    }
  }, [data, weekKey]);
  const refresh = useCallback(() => {
    safeRemoveItem(DISCOVERIES_KEY);
    setForceRefresh((n) => n + 1);
  }, []);
  return { discoveries, refresh, isRefreshing: isFetching };
}
function pickThree(candidates, _exclude) {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
}
const img60s = "/assets/60s-CBQDXpcg.png";
const img70s = "/assets/70s-DyvkDEwH.png";
const img80s = "/assets/80s-VHQWFYuM.png";
const img90s = "/assets/90s-CxVEs3gZ.png";
const imgAmbient = "/assets/ambient-C97Brv5a.png";
const imgBlues = "/assets/blues-DlFWZXVm.png";
const imgChillout = "/assets/chillout-DwquHmAW.png";
const imgClassical = "/assets/classical-D6FM6zRE.png";
const imgCountry = "/assets/country-BO0Vgvbs.png";
const imgElectronic = "/assets/electronic-PN062aQU.png";
const imgFunk = "/assets/funk-R7HS09Gy.png";
const imgHiphop = "/assets/hiphop-pCJae00m.png";
const imgJazz = "/assets/jazz-CLeKl9Wb.png";
const imgLatin = "/assets/latin-BneInEZD.png";
const imgMetal = "/assets/metal-DiP-IZEw.png";
const imgNews = "/assets/news-BLDhT2q5.png";
const imgPop = "/assets/pop-C3K1Zu3Q.png";
const imgRnb = "/assets/rnb-DgIN9M-T.png";
const imgReggae = "/assets/reggae-Cp60ZAym.png";
const imgRock = "/assets/rock-DFdP8ypO.png";
const imgSoul = "/assets/soul-CRej_D4d.png";
const imgTechno = "/assets/techno-V_WwtRnh.png";
const imgTrance = "/assets/trance-duKUIXGM.png";
const imgWorld = "/assets/world-WRMQAX9W.png";
const imgMousemusic = "/assets/mousemusic-B0D8GZUi.png";
const GENRE_IMAGES = {
  "60s": img60s,
  "70s": img70s,
  "80s": img80s,
  "90s": img90s,
  ambient: imgAmbient,
  blues: imgBlues,
  chillout: imgChillout,
  classical: imgClassical,
  country: imgCountry,
  electronic: imgElectronic,
  funk: imgFunk,
  hiphop: imgHiphop,
  jazz: imgJazz,
  latin: imgLatin,
  metal: imgMetal,
  news: imgNews,
  pop: imgPop,
  "r&b": imgRnb,
  reggae: imgReggae,
  rock: imgRock,
  soul: imgSoul,
  techno: imgTechno,
  trance: imgTrance,
  world: imgWorld,
  mousemusic: imgMousemusic
};
function GenreAnimation({ genre }) {
  const src = GENRE_IMAGES[genre.toLowerCase()];
  if (!src) return null;
  return /* @__PURE__ */ jsx(
    "img",
    {
      src,
      alt: genre,
      className: "absolute right-1 top-1/2 -translate-y-1/2 w-16 h-16 object-contain pointer-events-none drop-shadow-lg transition-transform duration-500 ease-out group-hover:scale-125",
      loading: "lazy"
    }
  );
}
const STORAGE_KEY$1 = "radiosphere_onboarding_banner_dismissed";
function OnboardingBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!safeGetItem(STORAGE_KEY$1)) setVisible(true);
  }, []);
  if (!visible) return null;
  const dismiss = () => {
    safeSetItem(STORAGE_KEY$1, "true");
    setVisible(false);
  };
  const features = [
    { icon: Gift, label: t("onboarding.free"), desc: t("onboarding.freeDesc") },
    { icon: ShieldOff, label: t("onboarding.noAds"), desc: t("onboarding.noAdsDesc") },
    { icon: Clock, label: t("onboarding.tbm"), desc: t("onboarding.tbmDesc") }
  ];
  return /* @__PURE__ */ jsx("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-500 mb-4", children: /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl p-5 shadow-2xl shadow-primary/5 overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-primary/0" }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: dismiss,
        className: "absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
        "aria-label": t("aria.close"),
        children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-heading font-bold text-foreground mb-3", children: t("onboarding.title") }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4", children: features.map(({ icon: Icon, label, desc }) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-start gap-3 p-3 rounded-xl bg-accent/40 hover:bg-accent/70 hover:scale-[1.02] transition-all duration-200 cursor-default",
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20", children: /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 text-primary-foreground" }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-foreground leading-tight", children: label }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground leading-snug mt-0.5", children: desc })
          ] })
        ]
      },
      label
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://play.google.com/store/apps/details?id=com.fhm.radiosphere",
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: () => umamiTrack$1("play-store-click", { location: "onboarding-banner" }),
          className: "inline-block hover:opacity-90 transition-opacity",
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png",
              alt: "Get it on Google Play",
              className: "h-10"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: dismiss,
          className: "text-xs text-muted-foreground hover:text-foreground transition-colors",
          children: t("onboarding.dismiss")
        }
      )
    ] })
  ] }) });
}
const LANG_MATCH = {
  fr: ["french", "français", "francais"],
  en: ["english", "anglais"],
  es: ["spanish", "español", "espanol", "castellano"],
  de: ["german", "deutsch", "allemand"],
  it: ["italian", "italiano"],
  nl: ["dutch", "nederlands", "flemish", "vlaams", "néerlandais", "neerlandais"],
  pt: ["portuguese", "português", "portugues"],
  pl: ["polish", "polski"],
  ru: ["russian", "русский"],
  tr: ["turkish", "türkçe", "turkce"],
  ja: ["japanese", "日本語"],
  zh: ["chinese", "mandarin", "中文"],
  ar: ["arabic", "العربية"],
  id: ["indonesian", "bahasa indonesia"],
  ms: ["malay", "bahasa melayu"],
  th: ["thai", "ภาษาไทย"]
};
function matchesUILanguage(stationLanguage, uiLang) {
  if (!stationLanguage) return false;
  const aliases = LANG_MATCH[uiLang];
  if (!aliases) return false;
  const langLower = stationLanguage.toLowerCase();
  return aliases.some((a) => langLower.includes(a));
}
const CACHE_KEY = "radiosphere_local_geo";
const CACHE_TTL = 1e3 * 60 * 60 * 24;
function loadCachedGeo() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
function saveCachedGeo(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
  }
}
function normalizeRaw(raw) {
  return {
    id: raw.stationuuid,
    name: raw.name,
    streamUrl: raw.url_resolved || raw.url,
    logo: raw.favicon || "",
    tags: raw.tags ? raw.tags.split(",").filter(Boolean) : [],
    country: raw.country || "",
    countryCode: raw.countrycode || "",
    language: raw.language || "",
    codec: raw.codec || "",
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
    clickcount: raw.clickcount || 0,
    homepage: raw.homepage || ""
  };
}
function SuggestedLocalStations({ isFavorite, onToggleFavorite }) {
  const { t, language } = useTranslation();
  const [stations, setStations] = useState([]);
  const [countryName, setCountryName] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        let geo = loadCachedGeo();
        if (!(geo == null ? void 0 : geo.country)) {
          const res = await fetch("https://get.geojs.io/v1/ip/country.json");
          if (!res.ok) throw new Error("geo failed");
          geo = await res.json();
          if (geo == null ? void 0 : geo.country) saveCachedGeo(geo);
        }
        if (!(geo == null ? void 0 : geo.country)) {
          if (!cancelled) setLoading(false);
          return;
        }
        const code = geo.country.toUpperCase();
        if (!cancelled) setCountryName(geo.name || code);
        let pool = [];
        try {
          const raw = await fetchWithMirrors(
            `stations/bycountrycodeexact/${encodeURIComponent(code)}`,
            { limit: "40", order: "clickcount", reverse: "true", hidebroken: "true" }
          );
          pool = raw.map(normalizeRaw).filter((s) => s.streamUrl && s.name);
        } catch (apiErr) {
          console.warn("[SuggestedLocalStations] API failed, falling back", apiErr);
          if (geo.name) {
            const data = await radioBrowserProvider.getStationsByCountry(geo.name, 40);
            pool = data.filter((s) => {
              var _a;
              return ((_a = s.countryCode) == null ? void 0 : _a.toUpperCase()) === code;
            });
          }
        }
        const matched = pool.filter((s) => matchesUILanguage(s.language, language));
        const seen = /* @__PURE__ */ new Set();
        const ordered = [...matched, ...pool].filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        }).slice(0, 10);
        if (!cancelled) setStations(ordered);
      } catch (e) {
        console.warn("[SuggestedLocalStations] failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [language]);
  if (loading) {
    return /* @__PURE__ */ jsxs("section", { className: "mb-3", children: [
      /* @__PURE__ */ jsx("div", { className: "h-6 w-56 bg-muted rounded mb-2 animate-pulse" }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-3 overflow-hidden", children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "w-28 h-28 rounded-xl bg-muted animate-pulse flex-shrink-0" }, i)) })
    ] });
  }
  if (stations.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "mb-3", children: [
    /* @__PURE__ */ jsxs("h2", { className: "text-lg font-heading font-semibold mb-2 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-[hsl(220,90%,60%)]" }),
      t("home.popularNearYou"),
      countryName && /* @__PURE__ */ jsxs("span", { className: "text-xs font-normal text-muted-foreground", children: [
        "(",
        countryName,
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsx(ScrollableRow, { children: stations.map((s) => /* @__PURE__ */ jsx(
      StationCard,
      {
        station: s,
        isFavorite: isFavorite(s.id),
        onToggleFavorite
      },
      s.id
    )) })
  ] });
}
const GENRES = ["60s", "70s", "80s", "90s", "ambient", "blues", "chillout", "classical", "country", "electronic", "funk", "hiphop", "jazz", "latin", "metal", "mousemusic", "news", "pop", "r&b", "reggae", "rock", "soul", "techno", "trance", "world"];
function HomePage({ recent, favorites, isFavorite, onToggleFavorite, onGenreClick }) {
  const { t } = useTranslation();
  const { discoveries, refresh, isRefreshing } = useWeeklyDiscoveries(favorites);
  const [favLimit, setFavLimit] = useState(10);
  const visibleFavs = favorites.slice(0, favLimit);
  const hasMoreFavs = favorites.length > favLimit;
  const scrollContainerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) setShowScrollTop(el.scrollTop > 300);
  }, []);
  const scrollToTop = () => {
    var _a;
    (_a = scrollContainerRef.current) == null ? void 0 : _a.scrollTo({ top: 0, behavior: "smooth" });
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-background px-4 lg:px-8 pt-6 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 lg:hidden", children: [
        /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be — Radio gratuite sans pub", className: "w-12 h-12 object-contain rounded-xl mix-blend-screen animate-logo-glow" }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-heading font-bold bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent whitespace-nowrap", children: [
          "RadioSphere.be",
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: " — Le lecteur radio gratuit sans publicité" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "hidden lg:block text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: t("nav.home") }),
      /* @__PURE__ */ jsx(CastButton, {})
    ] }) }),
    /* @__PURE__ */ jsxs("div", { ref: scrollContainerRef, onScroll: handleScroll, className: "flex-1 overflow-y-auto px-4 lg:px-8 pb-4", children: [
      /* @__PURE__ */ jsx(OnboardingBanner, {}),
      recent.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mb-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold mb-2 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: t("home.recentlyPlayed") }),
        /* @__PURE__ */ jsx(ScrollableRow, { children: recent.slice(0, 10).map((s) => /* @__PURE__ */ jsx(StationCard, { station: s, isFavorite: isFavorite(s.id), onToggleFavorite }, s.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-3", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-heading font-semibold mb-2 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4 text-[hsl(280,80%,60%)]" }),
          t("home.yourFavorites"),
          favorites.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[hsl(280,80%,60%)] text-white leading-none", children: favorites.length })
        ] }),
        favorites.length > 0 ? /* @__PURE__ */ jsxs(ScrollableRow, { children: [
          visibleFavs.map((s) => /* @__PURE__ */ jsx(StationCard, { station: s, isFavorite: true, onToggleFavorite }, s.id)),
          hasMoreFavs && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setFavLimit((prev) => prev + 10),
              className: "flex flex-col items-center justify-center w-28 flex-shrink-0 p-3 rounded-xl hover:bg-accent transition-colors gap-1",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-white rtl-flip" }) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: [
                  "+",
                  Math.min(10, favorites.length - favLimit)
                ] })
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("home.noFavorites") })
      ] }),
      discoveries.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-heading font-semibold bg-gradient-to-r from-[hsl(280,80%,60%)] to-[hsl(340,80%,60%)] bg-clip-text text-transparent flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
            t("home.weeklyDiscoveries")
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: refresh,
              disabled: isRefreshing,
              className: "p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50",
              "aria-label": t("aria.refresh"),
              children: /* @__PURE__ */ jsx(RefreshCw, { className: `w-4 h-4 ${isRefreshing ? "animate-spin" : ""}` })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(ScrollableRow, { children: discoveries.map((s) => /* @__PURE__ */ jsx(StationCard, { station: s, isFavorite: isFavorite(s.id), onToggleFavorite }, s.id)) })
      ] }),
      favorites.length === 0 && recent.length === 0 && /* @__PURE__ */ jsx(SuggestedLocalStations, { isFavorite, onToggleFavorite }),
      /* @__PURE__ */ jsxs("section", { className: "mb-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-heading font-semibold mb-2 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: t("home.exploreByGenre") }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3", children: GENRES.map((genre) => /* @__PURE__ */ jsx(GenreCard, { genre, onClick: () => onGenreClick(genre), t }, genre)) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mb-6 lg:hidden", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-primary/15 to-[hsl(280,80%,60%,0.1)] border border-primary/10 p-6 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30", children: /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be", className: "w-10 h-10 object-contain rounded-xl" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-heading font-bold text-foreground mb-1", children: t("home.androidTitle") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-4 max-w-[260px] mx-auto leading-relaxed", children: t("home.androidDesc") }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://play.google.com/store/apps/details?id=com.fhm.radiosphere",
            target: "_blank",
            rel: "noopener noreferrer",
            onClick: () => umamiTrack$1("play-store-click", { location: "homepage-cta" }),
            className: "inline-block hover:opacity-90 transition-opacity",
            children: /* @__PURE__ */ jsx(
              "img",
              {
                src: "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png",
                alt: "Get it on Google Play",
                className: "h-12"
              }
            )
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: scrollToTop,
          className: cn(
            "fixed bottom-48 right-4 z-50 w-10 h-10 rounded-full bg-primary/70 backdrop-blur-sm text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300",
            showScrollTop ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
          ),
          "aria-label": "Scroll to top",
          children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" })
        }
      )
    ] })
  ] });
}
const GENRE_COLORS = {
  "60s": "from-yellow-700 to-orange-400",
  "70s": "from-amber-800 to-orange-500",
  "80s": "from-fuchsia-700 to-pink-400",
  "90s": "from-cyan-700 to-teal-400",
  ambient: "from-indigo-800 to-blue-400",
  blues: "from-blue-900 to-indigo-500",
  chillout: "from-sky-700 to-cyan-400",
  classical: "from-blue-800 to-cyan-500",
  country: "from-yellow-800 to-amber-500",
  electronic: "from-violet-700 to-purple-400",
  funk: "from-orange-600 to-yellow-400",
  hiphop: "from-emerald-700 to-teal-400",
  jazz: "from-amber-700 to-yellow-500",
  latin: "from-red-600 to-yellow-500",
  metal: "from-gray-800 to-zinc-500",
  mousemusic: "from-purple-600 to-yellow-400",
  news: "from-slate-700 to-gray-400",
  pop: "from-pink-600 to-rose-400",
  "r&b": "from-rose-700 to-pink-500",
  reggae: "from-green-700 to-yellow-500",
  rock: "from-red-700 to-orange-500",
  soul: "from-orange-700 to-amber-400",
  techno: "from-purple-800 to-fuchsia-500",
  trance: "from-indigo-700 to-violet-400",
  world: "from-teal-700 to-emerald-400"
};
function GenreCard({ genre, onClick, t }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `group rounded-xl p-4 h-20 flex items-end bg-gradient-to-br ${GENRE_COLORS[genre] || "from-gray-700 to-gray-500"} cursor-pointer active:scale-95 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 hover:brightness-110 transition-all duration-300 ease-out shadow-lg border-t border-white/10 relative overflow-hidden`,
      onClick,
      children: [
        /* @__PURE__ */ jsx(GenreAnimation, { genre }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-heading font-bold text-white capitalize drop-shadow-md relative z-10", children: t("genre." + genre) })
      ]
    }
  );
}
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Label, { ref, className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className), ...props }));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Separator, { ref, className: cn("-mx-1 my-1 h-px bg-muted", className), ...props }));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
const FEATURE_ICONS = [Radio, Search, Heart, Music];
const FEATURE_KEYS = ["welcome.stations", "welcome.search", "welcome.favExport", "welcome.genres"];
function WelcomeModal({ open, onOpenChange, onComplete }) {
  const [selectedLang, setSelectedLang] = useState(detectInitialLanguage);
  const t = (key) => translations[selectedLang][key] ?? key;
  useEffect(() => {
    if (!open) return;
    try {
      document.documentElement.lang = selectedLang;
      document.documentElement.dir = selectedLang === "ar" ? "rtl" : "ltr";
    } catch {
    }
  }, [selectedLang, open]);
  const handleContinue = () => {
    onComplete(selectedLang);
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-6 rounded-2xl", children: [
    /* @__PURE__ */ jsxs(DialogTitle, { className: "sr-only", children: [
      "RadioSphere.be — ",
      t("welcome.subtitle")
    ] }),
    /* @__PURE__ */ jsx(DialogDescription, { className: "sr-only", children: t("welcome.subtitle") }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-primary/60 blur-3xl scale-[2.2] animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-[hsl(280,80%,60%)]/40 blur-2xl scale-[1.8] animate-pulse" }),
        /* @__PURE__ */ jsx(
          "img",
          {
            src: radioSphereLogo,
            alt: "RadioSphere.be",
            className: "w-24 h-24 object-contain rounded-2xl relative z-10 mix-blend-screen animate-logo-glow"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent mb-2 drop-shadow-[0_0_16px_hsla(250,80%,60%,0.4)]", children: "RadioSphere.be" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4", children: t("welcome.subtitle") }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://play.google.com/store/apps/details?id=com.fhm.radiosphere",
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: () => umamiTrack$1("play-store-click", { location: "welcome-modal" }),
          className: "block hover:opacity-90 transition-opacity mb-6",
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png",
              alt: "Get it on Google Play",
              className: "h-[4.5rem] mx-auto drop-shadow-lg"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 w-full max-w-xs mb-3", children: FEATURE_KEYS.map((key, i) => {
        const Icon = FEATURE_ICONS[i];
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center gap-1.5 rounded-lg bg-accent/80 border border-border/50 px-2.5 py-2",
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "w-3.5 h-3.5 text-primary shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-foreground text-left leading-tight", children: t(key) })
            ]
          },
          key
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 w-full max-w-xs mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-lg bg-accent/80 border border-border/50 px-2.5 py-2", children: [
          /* @__PURE__ */ jsx(Moon, { className: "w-3.5 h-3.5 text-primary shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-foreground text-left leading-tight", children: t("welcome.sleepTimer") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col justify-center rounded-lg border border-[hsl(45,90%,55%)]/60 bg-gradient-to-br from-[hsl(45,90%,55%)]/20 via-[hsl(40,95%,60%)]/15 to-[hsl(35,95%,50%)]/20 shadow-[0_0_12px_-2px_hsl(45,90%,55%,0.45)] px-2.5 py-1.5 text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Rewind, { className: "w-3.5 h-3.5 text-[hsl(45,95%,60%)] shrink-0 drop-shadow-[0_0_4px_hsl(45,95%,60%,0.6)]" }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold leading-tight bg-gradient-to-r from-[hsl(45,95%,65%)] to-[hsl(35,95%,55%)] bg-clip-text text-transparent", children: t("welcome.tbm") })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[9px] text-[hsl(45,90%,75%)]/90 leading-tight mt-0.5", children: t("welcome.tbmDesc") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xs mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mb-3", children: [
          /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4 text-primary" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: t("welcome.chooseLanguage") })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: selectedLang, onValueChange: (v) => setSelectedLang(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full rounded-xl bg-secondary text-foreground", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: LANGUAGE_OPTIONS.map((opt) => /* @__PURE__ */ jsx(SelectItem, { value: opt.value, children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("img", { src: opt.flagUrl, alt: opt.label, className: "w-5 h-4 object-cover rounded-sm" }),
            opt.label
          ] }) }, opt.value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleContinue,
          className: "w-full max-w-xs py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[hsl(220,90%,56%)] to-[hsl(280,80%,56%)] text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 flex items-center justify-center gap-2",
          children: [
            t("welcome.start"),
            /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 rtl-flip" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5 mt-5 mb-2", children: [
        /* @__PURE__ */ jsx("a", { href: "https://www.facebook.com/profile.php?id=61575475057830", target: "_blank", rel: "noopener noreferrer", className: "text-muted-foreground hover:text-primary transition-colors", title: "Facebook", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) }) }),
        /* @__PURE__ */ jsx("a", { href: "https://www.instagram.com/radiosphere.be/", target: "_blank", rel: "noopener noreferrer", className: "text-muted-foreground hover:text-primary transition-colors", title: "Instagram", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" }) }) }),
        /* @__PURE__ */ jsx("a", { href: "https://bsky.app/profile/radiospherebe.bsky.social", target: "_blank", rel: "noopener noreferrer", className: "text-muted-foreground hover:text-primary transition-colors", title: "Bluesky", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.603 3.496 6.159 3.18-4.397.645-7.945 2.267-4.453 7.803C4.6 24.457 9.456 20.78 12 17.036c2.544 3.744 7.063 7.088 9.67 4.194 3.492-5.536-.056-7.158-4.453-7.803 2.556.316 5.374-.553 6.159-3.18.246-.828.624-5.788.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" }) }) }),
        /* @__PURE__ */ jsx("a", { href: "https://www.tiktok.com/@radiosphere.be", target: "_blank", rel: "noopener noreferrer", className: "text-muted-foreground hover:text-primary transition-colors", title: "TikTok", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.65a8.16 8.16 0 0 0 4.77 1.52V6.73a4.85 4.85 0 0 1-1.84-.04Z" }) }) })
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://radiosphere.be/privacy-policy.html",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:underline mt-2",
          children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3" }),
            t("settings.privacyPolicy")
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-3 opacity-60", children: "radiosphere.be" })
    ] })
  ] }) });
}
function ExitConfirmDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const handleExit = async () => {
    try {
      const { App: App2 } = await import("@capacitor/app");
      await App2.exitApp();
    } catch {
      window.close();
    }
  };
  return /* @__PURE__ */ jsx(AlertDialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "max-w-[min(90vw,340px)] rounded-2xl p-5 gap-3", children: [
    /* @__PURE__ */ jsxs(AlertDialogHeader, { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base text-center", children: t("exit.title") }),
      /* @__PURE__ */ jsx(AlertDialogDescription, { className: "text-sm text-center", children: t("exit.description") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-3 pt-1", children: [
      /* @__PURE__ */ jsx(AlertDialogCancel, { className: "mt-0 flex-1", children: t("common.cancel") }),
      /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleExit, className: "flex-1", children: t("exit.confirm") })
    ] })
  ] }) });
}
function SleepTimerIndicator() {
  const { isActive, formattedTime, cancelTimer } = useSleepTimer();
  const { t } = useTranslation();
  if (!isActive) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed top-[env(safe-area-inset-top,24px)] right-3 z-50 mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md shadow-lg shadow-primary/10 animate-in fade-in slide-in-from-top-2 duration-300", children: [
    /* @__PURE__ */ jsx(Moon, { className: "w-3.5 h-3.5 text-primary animate-pulse" }),
    /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-primary tabular-nums", children: formattedTime }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          cancelTimer();
        },
        className: "w-4 h-4 rounded-full flex items-center justify-center text-primary/60 hover:text-primary transition-colors",
        "aria-label": t("sleepTimer.cancel"),
        children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
      }
    )
  ] });
}
const STORAGE_KEY = "radiosphere_inapp_banner_dismissed";
function InAppBrowserBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        setMinimised(true);
      }
    } catch {
    }
    if (isInAppBrowser()) setVisible(true);
  }, []);
  const minimise = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
    }
    setMinimised(true);
  };
  const expand = () => setMinimised(false);
  const openExternal = () => {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    openInExternalBrowser(url);
  };
  const handleCopy = async () => {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    }
  };
  if (!visible) return null;
  if (minimised) {
    return /* @__PURE__ */ jsx(
      "button",
      {
        onClick: expand,
        "aria-label": t("inAppBrowser.warning"),
        className: "fixed top-2 right-2 z-40 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500 text-white shadow-lg text-xs font-semibold hover:opacity-90 transition-opacity",
        style: { marginTop: "env(safe-area-inset-top, 0px)" },
        children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5" })
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "alert",
      className: "fixed top-0 inset-x-0 z-40 bg-amber-500 text-white px-3 py-2.5 shadow-lg",
      style: { paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" },
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 max-w-3xl mx-auto", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm leading-snug font-medium", children: t("inAppBrowser.warning") }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-1.5", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: openExternal,
                className: "inline-flex items-center gap-1 rounded-md bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors px-2.5 py-1.5 text-[11px] font-semibold",
                "data-umami-event": "inapp-banner-open-external",
                children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
                  /* @__PURE__ */ jsx("span", { children: t("inAppBrowser.openExternal") })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleCopy,
                className: "inline-flex items-center gap-1 rounded-md bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors px-2.5 py-1.5 text-[11px] font-semibold",
                "data-umami-event": "inapp-banner-copy-link",
                children: [
                  copied ? /* @__PURE__ */ jsx(Check, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(Copy, { className: "w-3 h-3" }),
                  /* @__PURE__ */ jsx("span", { children: copied ? "✓" : "Copy link" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: minimise,
            className: "shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors",
            "aria-label": t("aria.close"),
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] })
    }
  );
}
function ClientOnly({
  children,
  fallback = null
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return /* @__PURE__ */ jsx(Fragment, { children: mounted ? children : fallback });
}
function useBackButton({
  onBack,
  onDoubleBackHome,
  isHome,
  isFullScreen
}) {
  const lastBackPressRef = useRef(0);
  const backPressTimeoutRef = useRef(null);
  const isHomeRef = useRef(isHome);
  const isFullScreenRef = useRef(isFullScreen);
  const onBackRef = useRef(onBack);
  const onDoubleBackHomeRef = useRef(onDoubleBackHome);
  useEffect(() => {
    isHomeRef.current = isHome;
  }, [isHome]);
  useEffect(() => {
    isFullScreenRef.current = isFullScreen;
  }, [isFullScreen]);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);
  useEffect(() => {
    onDoubleBackHomeRef.current = onDoubleBackHome;
  }, [onDoubleBackHome]);
  const handleBackPress = useCallback(() => {
    if (isFullScreenRef.current) {
      onBackRef.current();
      return;
    }
    if (!isHomeRef.current) {
      onBackRef.current();
      return;
    }
    const now = Date.now();
    const timeSinceLastPress = now - lastBackPressRef.current;
    if (timeSinceLastPress < 300) {
      if (backPressTimeoutRef.current) clearTimeout(backPressTimeoutRef.current);
      onDoubleBackHomeRef.current();
      lastBackPressRef.current = 0;
    } else {
      lastBackPressRef.current = now;
      if (backPressTimeoutRef.current) clearTimeout(backPressTimeoutRef.current);
      backPressTimeoutRef.current = setTimeout(() => {
        lastBackPressRef.current = 0;
      }, 300);
    }
  }, []);
  useEffect(() => {
    if (!isCapacitorNative$1()) {
      return;
    }
    let nativeListenerRemove = null;
    (async () => {
      try {
        const { App: App2 } = await import("@capacitor/app");
        const listener = await App2.addListener("backButton", () => {
          handleBackPress();
        });
        nativeListenerRemove = () => listener.remove();
        console.log("[RadioSphere] Native backButton listener registered");
      } catch (e) {
        console.warn("[RadioSphere] Failed to register native backButton listener:", e);
      }
    })();
    return () => {
      if (nativeListenerRemove) nativeListenerRemove();
      if (backPressTimeoutRef.current) clearTimeout(backPressTimeoutRef.current);
    };
  }, [handleBackPress]);
}
const FLAG_KEY = "radiosphere_ad_landing_tracked";
function trackAdLandingOnce() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(FLAG_KEY) === "1") return;
  } catch {
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || "";
    const fbclid = params.get("fbclid");
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const isFbReferrer = /facebook\.com|fb\.me|fbcdn|instagram\.com|threads\.net|t\.co|tiktok\.com/i.test(referrer);
    const isPaidArrival = !!fbclid || !!utmSource || isFbReferrer;
    if (!isPaidArrival && !isInAppBrowser()) {
      try {
        sessionStorage.setItem(FLAG_KEY, "1");
      } catch {
      }
      return;
    }
    umamiTrack$1("ad-landing", {
      source: utmSource || (isFbReferrer ? "facebook-organic" : "unknown"),
      medium: utmMedium || (fbclid ? "paid" : "referral"),
      campaign: utmCampaign || "none",
      hasFbclid: !!fbclid,
      referrer: referrer.slice(0, 120),
      webview: isInAppBrowser(),
      path: window.location.pathname
    });
    try {
      sessionStorage.setItem(FLAG_KEY, "1");
    } catch {
    }
  } catch (e) {
    console.warn("[RadioSphere] ad-landing tracking failed:", e);
  }
}
const SearchPage = lazy(() => import("./assets/SearchPage-CnyNtXGu.js").then((m) => ({ default: m.SearchPage })));
const LibraryPage = lazy(() => import("./assets/LibraryPage-CNL7ScNk.js").then((m) => ({ default: m.LibraryPage })));
const AboutPage = lazy(() => import("./assets/AboutPage-gH2tV3NZ.js").then((m) => ({ default: m.AboutPage })));
const SettingsPage = lazy(() => import("./assets/SettingsPage-DORhk1QO.js").then((m) => ({ default: m.SettingsPage })));
const PrivacyPolicyPage = lazy(() => import("./assets/PrivacyPolicyPage-owUoaqpj.js").then((m) => ({ default: m.PrivacyPolicyPage })));
const ONBOARDING_KEY = "radiosphere_onboarded";
function hasCompletedOnboarding() {
  try {
    if (true) return true;
    if (isInAppBrowser() && !isLocalStorageWorking()) {
      try {
        return sessionStorage.getItem(ONBOARDING_KEY) === "true";
      } catch {
        return false;
      }
    }
    return safeGetItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}
function PageLoader() {
  return /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" }) });
}
const ROUTE_TO_TAB = {
  "/": "home",
  "/search": "search",
  "/library": "library",
  "/settings": "settings",
  "/about": "about"
};
const TAB_TO_ROUTE = {
  home: "/",
  search: "/search",
  library: "/library",
  settings: "/settings",
  about: "/about"
};
const PAGE_META = {
  home: {
    title: "RadioSphere.be — Radio gratuite sans pub | TimeBack Machine",
    description: "Écoutez 50 000+ stations radio gratuites sans publicité. Découvrez la TimeBack Machine pour réécouter le direct. Streaming HD, Chromecast."
  },
  search: {
    title: "Rechercher des stations — RadioSphere.be",
    description: "Recherchez parmi 50 000+ stations radio par genre, pays ou langue. Trouvez votre radio préférée sur RadioSphere.be."
  },
  library: {
    title: "Ma bibliothèque — RadioSphere.be",
    description: "Retrouvez vos stations radio favorites et récemment écoutées. Gérez votre collection sur RadioSphere.be."
  },
  settings: {
    title: "Paramètres — RadioSphere.be",
    description: "Langue, minuterie de sommeil, gestion des favoris et mode d'emploi. Personnalisez votre expérience sur RadioSphere.be."
  },
  about: {
    title: "À propos — RadioSphere.be",
    description: "Informations, vie privée et sources sur RadioSphere.be, votre lecteur radio gratuit sans publicité."
  },
  privacy: {
    title: "Politique de confidentialité — RadioSphere.be",
    description: "Découvrez comment RadioSphere.be protège vos données. Aucun compte requis, données stockées localement uniquement."
  }
};
const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = ROUTE_TO_TAB[location.pathname] || "home";
  const initialPrivacy = location.pathname === "/privacy";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedGenre, setSelectedGenre] = useState();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(initialPrivacy);
  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      startTransition(() => setShowWelcome(true));
    }
  }, []);
  const { favorites, toggleFavorite, isFavorite, recent } = useFavoritesContext();
  const { isFullScreen, closeFullScreen, currentStation } = usePlayer();
  const { setLanguage } = useTranslation();
  useEffect(() => {
    trackAdLandingOnce();
  }, []);
  const currentMetaKey = showPrivacy ? "privacy" : activeTab;
  const meta = PAGE_META[currentMetaKey] || PAGE_META.home;
  const handleTagClick = useCallback((tag) => {
    setSelectedGenre(tag);
    setActiveTab("search");
  }, []);
  const handleTabChange = useCallback((tab) => {
    if (tab !== "search") setSelectedGenre(void 0);
    setShowPrivacy(false);
    setActiveTab(tab);
    navigate(TAB_TO_ROUTE[tab] || "/", { replace: true });
  }, [navigate]);
  const handleWelcomeComplete = useCallback((lang) => {
    setLanguage(lang);
    safeSetItem(ONBOARDING_KEY, "true");
    try {
      sessionStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
    }
    setShowWelcome(false);
  }, [setLanguage]);
  const handleWelcomeOpenChange = useCallback((open) => {
    setShowWelcome(open);
    if (!open) {
      safeSetItem(ONBOARDING_KEY, "true");
      try {
        sessionStorage.setItem(ONBOARDING_KEY, "true");
      } catch {
      }
    }
  }, []);
  const handleReopenWelcome = useCallback(() => {
    setShowWelcome(true);
  }, []);
  const handleResetApp = useCallback(async () => {
    safeClearAll();
    try {
      const idb = window.indexedDB;
      if (typeof (idb == null ? void 0 : idb.databases) === "function") {
        const dbs = await idb.databases();
        for (const db of dbs) {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        }
      }
    } catch {
    }
    window.location.replace("/");
  }, []);
  const handleNavigatePrivacy = useCallback(() => {
    setShowPrivacy(true);
    setActiveTab("about");
    navigate("/privacy", { replace: true });
  }, [navigate]);
  const handleNavigateSettings = useCallback(() => {
    setShowPrivacy(false);
    setActiveTab("settings");
    navigate("/settings", { replace: true });
  }, [navigate]);
  useBackButton({
    onBack: () => {
      if (showWelcome) return;
      if (isFullScreen) {
        closeFullScreen();
      } else if (showPrivacy) {
        setShowPrivacy(false);
      } else {
        setActiveTab("home");
      }
    },
    onDoubleBackHome: () => setShowExitDialog(true),
    isHome: activeTab === "home",
    isFullScreen
  });
  const renderContent = () => {
    if (showPrivacy) {
      return /* @__PURE__ */ jsx(PrivacyPolicyPage, { onBack: () => setShowPrivacy(false) });
    }
    switch (activeTab) {
      case "home":
        return /* @__PURE__ */ jsx(HomePage, { recent, favorites, isFavorite, onToggleFavorite: toggleFavorite, onGenreClick: handleTagClick });
      case "search":
        return /* @__PURE__ */ jsx(SearchPage, { isFavorite, onToggleFavorite: toggleFavorite, initialGenre: selectedGenre });
      case "library":
        return /* @__PURE__ */ jsx(LibraryPage, { favorites, isFavorite, onToggleFavorite: toggleFavorite });
      case "settings":
        return /* @__PURE__ */ jsx(SettingsPage, { onReopenWelcome: handleReopenWelcome, onResetApp: handleResetApp });
      case "about":
        return /* @__PURE__ */ jsx(AboutPage, { onReopenWelcome: handleReopenWelcome, onNavigatePrivacy: handleNavigatePrivacy, onNavigateSettings: handleNavigateSettings });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs(SleepTimerProvider, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: meta.title }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: meta.description }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: `https://radiosphere.be${location.pathname === "/" ? "" : location.pathname}` }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: meta.title }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: meta.description }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: `https://radiosphere.be${location.pathname === "/" ? "" : location.pathname}` }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: meta.title }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: meta.description })
    ] }),
    /* @__PURE__ */ jsxs(ClientOnly, { children: [
      /* @__PURE__ */ jsx(SleepTimerIndicator, {}),
      /* @__PURE__ */ jsx(InAppBrowserBanner, {})
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex h-full bg-background", children: [
      /* @__PURE__ */ jsx(ClientOnly, { children: /* @__PURE__ */ jsx(DesktopSidebar, { activeTab, onTabChange: handleTabChange }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `flex-1 flex flex-col overflow-hidden ${currentStation ? "pb-28 lg:pb-0" : "pb-14 lg:pb-0"}`,
            style: { paddingTop: "env(safe-area-inset-top, 0px)" },
            children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(PageLoader, {}), children: renderContent() })
          }
        ),
        /* @__PURE__ */ jsxs(ClientOnly, { children: [
          /* @__PURE__ */ jsx(MiniPlayer, {}),
          /* @__PURE__ */ jsx(BottomNav, { activeTab, onTabChange: handleTabChange }),
          /* @__PURE__ */ jsx(DesktopPlayerBar, {}),
          /* @__PURE__ */ jsx(Footer, {})
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(ClientOnly, { children: [
      /* @__PURE__ */ jsx(FullScreenPlayer, { onTagClick: handleTagClick }),
      /* @__PURE__ */ jsx(ExitConfirmDialog, { open: showExitDialog, onOpenChange: setShowExitDialog }),
      /* @__PURE__ */ jsx(
        WelcomeModal,
        {
          open: showWelcome,
          onOpenChange: handleWelcomeOpenChange,
          onComplete: handleWelcomeComplete
        }
      )
    ] })
  ] });
};
const queryClient = new QueryClient();
function CoreProviders({ children }) {
  const { addRecent } = useFavoritesContext();
  return /* @__PURE__ */ jsx(PlayerProvider, { onStationPlay: addRecent, children: /* @__PURE__ */ jsx(StreamBufferProvider, { children }) });
}
const App = () => /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx(LanguageProvider, { children: /* @__PURE__ */ jsx(FavoritesProvider, { children: /* @__PURE__ */ jsxs(CoreProviders, { children: [
  /* @__PURE__ */ jsx(Toaster$1, {}),
  /* @__PURE__ */ jsx(Toaster, {}),
  /* @__PURE__ */ jsx(Index, {}),
  /* @__PURE__ */ jsx(Outlet, {})
] }) }) }) }) }) });
async function clearAllCachesAndReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
  }
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
  }
  window.location.reload();
}
function RouteErrorFallback() {
  const inApp = typeof window !== "undefined" && isInAppBrowser();
  if (inApp) {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center gap-5", children: [
      /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be", className: "w-16 h-16 object-contain rounded-2xl opacity-90" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 max-w-sm", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-heading font-bold", children: "RadioSphere.be" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Le navigateur intégré ne supporte pas tout le site. Ouvrez‑le dans votre navigateur habituel." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80", children: "This in-app browser is limited. Open the site in your regular browser." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2 w-full max-w-xs", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => openInExternalBrowser(url),
            className: "flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity",
            "data-umami-event": "route-error-open-external",
            children: "Ouvrir dans le navigateur"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              void copyToClipboard(url);
            },
            className: "flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border hover:opacity-90 transition-opacity",
            "data-umami-event": "route-error-copy-link",
            children: "Copier le lien"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => window.location.reload(),
          className: "text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline",
          children: "Réessayer / Try again"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8 text-center gap-6", children: [
    /* @__PURE__ */ jsx("img", { src: radioSphereLogo, alt: "RadioSphere.be", className: "w-16 h-16 object-contain rounded-2xl opacity-80" }),
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-heading font-bold", children: "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground max-w-sm", children: "An unexpected error occurred. Please reload the page to continue." }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => window.location.reload(),
          className: "px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity",
          children: "Reload"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            void clearAllCachesAndReload();
          },
          className: "px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border hover:opacity-90 transition-opacity",
          children: "Clear cache & reload"
        }
      )
    ] })
  ] });
}
const routes = [
  {
    path: "/",
    Component: App,
    errorElement: /* @__PURE__ */ jsx(RouteErrorFallback, {}),
    children: [
      { index: true, Component: () => null },
      { path: "search", Component: () => null },
      { path: "library", Component: () => null },
      { path: "settings", Component: () => null },
      { path: "about", Component: () => null },
      { path: "privacy", Component: () => null }
    ]
  }
];
const createRoot = ViteReactSSG({ routes });
const CRASH_FLAG_KEY = "radiosphere_crash_purge_pending";
function isPreviewHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".lovableproject.com") || host.endsWith(".lovable.app") || host.includes("localhost");
}
async function purgeServiceWorkersAndCaches(reason) {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
  }
  console.log(`[RadioSphere] ${reason} — service workers and caches cleared`);
}
function isJsonParseCrash(message) {
  if (!message) return false;
  const m = String(message);
  return m.includes("JSON.parse") || m.includes("Unexpected token") || m.includes("Unexpected end of JSON") || m.includes("is not valid JSON");
}
const HYDRATION_REACT_CODES = /* @__PURE__ */ new Set(["418", "421", "422", "423", "425", "426", "428"]);
function extractReactErrorCode(message) {
  if (!message) return null;
  const m = /Minified React error #(\d+)/.exec(String(message));
  return m ? m[1] : null;
}
function extractReactErrorUrl(message) {
  if (!message) return null;
  const m = /https?:\/\/react\.dev\/errors\/[^\s"')]+/.exec(String(message));
  return m ? m[0] : null;
}
function extractReactErrorArgs(message) {
  if (!message) return [];
  const out = [];
  const re = /[?&]args(?:\[\])?=([^&\s"')]+)/g;
  let m;
  while ((m = re.exec(String(message))) !== null) {
    try {
      out.push(decodeURIComponent(m[1]));
    } catch {
      out.push(m[1]);
    }
  }
  return out;
}
function collectErrorTextChunks(...args) {
  const parts = [];
  for (const a of args) {
    if (a == null) continue;
    if (typeof a === "string") parts.push(a);
    else if (a instanceof Error) {
      parts.push(a.message ?? "");
      if (a.stack) parts.push(a.stack);
      const cause = a.cause;
      if (cause instanceof Error) {
        parts.push(cause.message ?? "");
        if (cause.stack) parts.push(cause.stack);
      } else if (typeof cause === "string") parts.push(cause);
    } else {
      try {
        parts.push(String(a));
      } catch {
      }
    }
  }
  return parts.join(" \n ");
}
function isHydrationError(message) {
  if (!message) return false;
  const m = String(message);
  if (m.includes("Hydration failed") || m.includes("hydrating") || m.includes("did not match") || m.includes("Text content does not match")) return true;
  const code = extractReactErrorCode(m);
  return !!code && HYDRATION_REACT_CODES.has(code);
}
function trunc(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) : s;
}
function envInfo() {
  var _a;
  try {
    const nav = navigator;
    return {
      ua: trunc(nav.userAgent, 160),
      lang: nav.language,
      online: nav.onLine,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      dpr: window.devicePixelRatio,
      net: ((_a = nav.connection) == null ? void 0 : _a.effectiveType) ?? "unknown",
      mem: nav.deviceMemory ?? "unknown",
      visibility: document.visibilityState
    };
  } catch {
    return {};
  }
}
function umamiTrack(event, data) {
  var _a;
  try {
    (_a = window.umami) == null ? void 0 : _a.track(event, data);
  } catch {
  }
}
function reportCrash(kind, message, extra) {
  try {
    sessionStorage.setItem(CRASH_FLAG_KEY, "1");
  } catch {
  }
  umamiTrack("js-crash", {
    kind,
    message: trunc(message, 300),
    route: window.location.pathname,
    ...envInfo(),
    ...extra ?? {}
  });
}
const _seenEvents = /* @__PURE__ */ new Set();
function reportOnce(event, dedupeKey, payload) {
  if (_seenEvents.has(dedupeKey)) return;
  _seenEvents.add(dedupeKey);
  umamiTrack(event, payload);
}
function reportHydrationError(rawMessage, source, extra) {
  const code = extractReactErrorCode(rawMessage);
  let url = extractReactErrorUrl(rawMessage);
  const stackText = typeof (extra == null ? void 0 : extra.stack) === "string" ? extra.stack : "";
  if (!url && stackText) url = extractReactErrorUrl(stackText);
  if (!url && code) url = `https://react.dev/errors/${code}`;
  const args = extractReactErrorArgs(rawMessage) || extractReactErrorArgs(stackText);
  const eventName = code ? `hydration-error-${code}` : "hydration-error";
  const dedupeKey = `${eventName}|${url ?? trunc(rawMessage, 120)}|${window.location.pathname}`;
  const payload = {
    code: code ?? "unknown",
    url: url ?? "",
    args: args.length ? args.join("|") : "",
    message: trunc(rawMessage, 300),
    route: window.location.pathname,
    source,
    ...envInfo(),
    ...extra ?? {}
  };
  reportOnce(eventName, dedupeKey, payload);
  if (eventName !== "hydration-error") {
    reportOnce("hydration-error", `generic|${dedupeKey}`, payload);
  }
}
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : String(reason);
    const stack = reason instanceof Error ? trunc(reason.stack, 600) : "";
    console.warn("[RadioSphere] Unhandled promise rejection:", reason);
    if (isHydrationError(message)) {
      reportHydrationError(message, "error-event", { stack, async: true });
    } else if (isJsonParseCrash(message)) {
      reportCrash("unhandledrejection", message, { stack });
    } else {
      umamiTrack("unhandled-rejection", {
        message: trunc(message, 300),
        name: reason instanceof Error ? reason.name : typeof reason,
        stack,
        route: window.location.pathname,
        ...envInfo()
      });
    }
    event.preventDefault();
  });
  window.addEventListener("error", (event) => {
    const err = event.error;
    const errMessage = err instanceof Error ? err.message : "";
    const message = errMessage || event.message || "";
    const stack = err instanceof Error ? trunc(err.stack, 600) : "";
    const location = `${event.filename || ""}:${event.lineno || 0}:${event.colno || 0}`;
    const fullText = `${message}
${stack}`;
    if (isHydrationError(fullText)) {
      console.warn("[RadioSphere] Hydration error detected:", message);
      reportHydrationError(fullText, "error-event", { stack, location });
      return;
    }
    if (isJsonParseCrash(message)) {
      console.warn("[RadioSphere] Sync error (JSON parse):", message);
      reportCrash("error", message, { stack, location });
      return;
    }
    if (message) {
      umamiTrack("js-error", {
        name: err instanceof Error ? err.name : "Error",
        message: trunc(message, 300),
        location,
        stack,
        route: window.location.pathname,
        ...envInfo()
      });
    }
  });
  const origConsoleError = console.error;
  console.error = function patchedConsoleError(...args) {
    try {
      const msg = collectErrorTextChunks(...args);
      if (isHydrationError(msg)) {
        const errArg = args.find((a) => a instanceof Error);
        reportHydrationError(msg, "console-error", { stack: trunc((errArg == null ? void 0 : errArg.stack) ?? msg, 600) });
      }
    } catch {
    }
    return origConsoleError.apply(console, args);
  };
  window.addEventListener("error", (event) => {
    const target = event.target;
    if (!target || target === window) return;
    const tag = (target.tagName || "").toLowerCase();
    if (tag === "script" || tag === "link") {
      const src = target.src || target.href || "";
      umamiTrack("asset-load-error", {
        tag,
        src: trunc(src, 300),
        route: window.location.pathname,
        ...envInfo()
      });
    }
  }, true);
  let firstHiddenReported = false;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" || firstHiddenReported) return;
    firstHiddenReported = true;
    const t = performance.now();
    if (t < 1e4) {
      umamiTrack("early-bounce", {
        ms: Math.round(t),
        route: window.location.pathname,
        ...envInfo()
      });
    }
  });
  window.addEventListener("beforeinstallprompt", (e) => {
    var _a;
    umamiTrack("pwa-install-available");
    const promptEvt = e;
    (_a = promptEvt.userChoice) == null ? void 0 : _a.then((choice) => {
      umamiTrack(choice.outcome === "accepted" ? "pwa-install-accepted" : "pwa-install-rejected");
    }).catch(() => {
    });
  });
  window.addEventListener("appinstalled", () => {
    umamiTrack("pwa-installed");
  });
}
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if (isPreviewHost()) {
    void purgeServiceWorkersAndCaches("Preview environment detected");
  } else if (isInAppBrowser()) {
    console.log("[RadioSphere] In-app WebView detected — skipping SW registration and purging caches");
    void purgeServiceWorkersAndCaches("In-app WebView detected");
  } else {
    try {
      if (sessionStorage.getItem(CRASH_FLAG_KEY) === "1" && "caches" in window) {
        sessionStorage.removeItem(CRASH_FLAG_KEY);
        caches.delete("api-cache").then((deleted) => {
          console.log(`[RadioSphere] api-cache purge after crash: ${deleted ? "ok" : "no entry"}`);
        }).catch(() => {
        });
      }
    } catch {
    }
    import("./assets/virtual_pwa-register-CEIzDaeC.js").then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          if (confirm("Une nouvelle version de RadioSphere.be est disponible. Recharger ?")) {
            window.location.reload();
          }
        },
        onOfflineReady() {
          console.log("[RadioSphere] App prête pour le mode hors ligne");
        }
      });
    }).catch((e) => {
      console.warn("[RadioSphere] PWA register failed:", e);
    });
  }
}
export {
  AlertDialog as A,
  Button as B,
  AlertDialogTitle as C,
  Dialog as D,
  AlertDialogDescription as E,
  AlertDialogFooter as F,
  AlertDialogCancel as G,
  AlertDialogAction as H,
  DialogDescription as I,
  DialogFooter as J,
  DialogClose as K,
  LANGUAGE_OPTIONS as L,
  OnboardingBanner as O,
  StationCard as S,
  safeSetItem as a,
  radioSphereLogo as b,
  cn as c,
  createRoot,
  useIsMobile as d,
  DialogTrigger as e,
  DialogContent as f,
  getCountries as g,
  DialogHeader as h,
  DialogTitle as i,
  useSleepTimer as j,
  useFavoritesContext as k,
  Select as l,
  SelectTrigger as m,
  SelectValue as n,
  SelectContent as o,
  SelectItem as p,
  SLEEP_TIMER_OPTIONS as q,
  radioBrowserProvider as r,
  safeGetItem as s,
  toast as t,
  useTranslation as u,
  isNative as v,
  searchStationByUrl as w,
  AlertDialogTrigger as x,
  AlertDialogContent as y,
  AlertDialogHeader as z
};
