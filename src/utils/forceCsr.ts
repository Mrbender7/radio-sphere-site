/**
 * Cross-storage "force CSR" flag.
 *
 * When set, the next boot of the app skips React hydration and mounts with
 * `createRoot()` instead. This is our safety net for any browser where the
 * SSG HTML produces a hydration mismatch (#418/#421/#423/#425) — Edge
 * InPrivate, FB/IG/TikTok WebViews, browser extensions injecting DOM, locale
 * auto-translation, etc.
 *
 * We write the flag to sessionStorage AND localStorage AND a URL hash marker,
 * so even if one of them is unavailable (private mode wiping session,
 * partitioned localStorage, etc.) the next page load still picks it up.
 *
 * The localStorage entry is auto-expired ~5 minutes after being written so a
 * one-off bug never permanently disables hydration for a returning visitor.
 */

export const FORCE_CSR_KEY = "__rsForceCSR";
export const FORCE_CSR_HASH = "rs-csr";
const TTL_MS = 5 * 60 * 1000;

function trySession(fn: () => void) {
  try { fn(); } catch { /* noop */ }
}
function tryLocal(fn: () => void) {
  try { fn(); } catch { /* noop */ }
}

export function setForceCsr(): void {
  if (typeof window === "undefined") return;
  trySession(() => sessionStorage.setItem(FORCE_CSR_KEY, "1"));
  tryLocal(() => localStorage.setItem(FORCE_CSR_KEY, String(Date.now())));
}

export function clearForceCsr(): void {
  if (typeof window === "undefined") return;
  trySession(() => sessionStorage.removeItem(FORCE_CSR_KEY));
  tryLocal(() => localStorage.removeItem(FORCE_CSR_KEY));
}

export function shouldForceCsr(): boolean {
  if (typeof window === "undefined") return false;
  // 1. session flag (preferred — tab-scoped)
  try {
    if (sessionStorage.getItem(FORCE_CSR_KEY) === "1") return true;
  } catch { /* noop */ }
  // 2. URL hash marker (works even with no storage)
  try {
    if (window.location.hash.includes(FORCE_CSR_HASH)) return true;
  } catch { /* noop */ }
  // 3. local flag with TTL
  try {
    const raw = localStorage.getItem(FORCE_CSR_KEY);
    if (raw) {
      const ts = Number(raw);
      if (Number.isFinite(ts) && Date.now() - ts < TTL_MS) return true;
      // expired
      localStorage.removeItem(FORCE_CSR_KEY);
    }
  } catch { /* noop */ }
  return false;
}

/** Force CSR then reload the page. Adds the hash marker as last-resort. */
export function forceCsrAndReload(): void {
  if (typeof window === "undefined") return;
  setForceCsr();
  try {
    const url = new URL(window.location.href);
    if (!url.hash.includes(FORCE_CSR_HASH)) {
      url.hash = url.hash ? `${url.hash}&${FORCE_CSR_HASH}` : FORCE_CSR_HASH;
    }
    window.location.replace(url.toString());
  } catch {
    try { window.location.reload(); } catch { /* noop */ }
  }
}
