import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { u as useTranslation } from "../main.mjs";
const COPYRIGHT_YEAR = 2026;
function AboutFooter() {
  const { t } = useTranslation();
  const createdBy = t("footer.createdBy");
  const [createdByPrefix, createdBySuffix] = createdBy.split("Franck Malherbe");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6 select-none space-y-1", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
        "© ",
        COPYRIGHT_YEAR,
        " RadioSphere.be — ",
        createdByPrefix,
        /* @__PURE__ */ jsx("a", { href: "https://franckmalherbe.be", target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline", children: "Franck Malherbe" }),
        createdBySuffix
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
        t("footer.poweredByPrefix"),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://www.radio-browser.info/",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-primary hover:underline",
            children: "Radio Browser"
          }
        ),
        t("footer.poweredBySuffix")
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4 pt-2 pb-4", children: [
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://www.facebook.com/profile.php?id=61575475057830",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-muted-foreground hover:text-primary transition-colors",
          "aria-label": "Facebook",
          children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) })
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
          children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" }) })
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
          children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.673 3.563 6.691 3.21-4.476.726-8.056 2.525-4.174 7.07C6.72 24.438 10.16 21.086 12 18c1.84 3.086 5.147 6.376 8.859 2.527 3.882-4.545.302-6.344-4.174-7.07 3.018.353 5.906-.583 6.691-3.21.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" }) })
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
          children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.65a8.16 8.16 0 0 0 4.77 1.52V6.73a4.85 4.85 0 0 1-1.84-.04Z" }) })
        }
      )
    ] })
  ] });
}
export {
  AboutFooter as A
};
