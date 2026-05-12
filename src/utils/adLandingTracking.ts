/**
 * Track first arrival on the site so we can measure the FB ads campaign.
 *
 * Captures:
 *  - referrer (l.facebook.com, lm.facebook.com, instagram.com, etc.)
 *  - utm_source / utm_medium / utm_campaign
 *  - fbclid (Facebook click id)
 *  - whether we're inside an in-app WebView
 *  - the landing pathname
 *
 * Fires only ONCE per browser tab (sessionStorage flag) to avoid inflating
 * Umami counts on every navigation.
 */

import { umamiTrack } from "@/utils/umamiTracking";
import { isInAppBrowser } from "@/utils/inAppBrowser";

const FLAG_KEY = "radiosphere_ad_landing_tracked";

export function trackAdLandingOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(FLAG_KEY) === "1") return;
  } catch { /* WebView may throw — keep going, worst case we double-track */ }

  try {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || "";
    const fbclid = params.get("fbclid");
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");

    // Detect FB / IG / Threads referrer even without UTM tags
    const isFbReferrer = /facebook\.com|fb\.me|fbcdn|instagram\.com|threads\.net|t\.co|tiktok\.com/i.test(referrer);
    const isPaidArrival = !!fbclid || !!utmSource || isFbReferrer;

    if (!isPaidArrival && !isInAppBrowser()) {
      // Don't pollute Umami with organic direct visits
      try { sessionStorage.setItem(FLAG_KEY, "1"); } catch { /* noop */ }
      return;
    }

    umamiTrack("ad-landing", {
      source: utmSource || (isFbReferrer ? "facebook-organic" : "unknown"),
      medium: utmMedium || (fbclid ? "paid" : "referral"),
      campaign: utmCampaign || "none",
      hasFbclid: !!fbclid,
      referrer: referrer.slice(0, 120),
      webview: isInAppBrowser(),
      path: window.location.pathname,
    });

    try { sessionStorage.setItem(FLAG_KEY, "1"); } catch { /* noop */ }

    // Strip tracking params from the URL after capture. Two reasons:
    //  1. Breaks the reload-loop crash pattern observed in Umami: when
    //     hydration fails inside a slow WebView, users reload — without this
    //     cleanup the same `?fbclid=…` URL re-triggers the same crash.
    //  2. Cleaner canonical URL if the user shares the page from the address
    //     bar. Tracking has already been recorded in the umami event above,
    //     so we lose nothing.
    try {
      const TRACKING_PARAMS = [
        "fbclid", "gclid", "msclkid", "yclid", "ttclid", "twclid",
        "utm_source", "utm_medium", "utm_campaign", "utm_term",
        "utm_content", "utm_id", "utm_name", "utm_brand",
        "mc_cid", "mc_eid", "_ga", "ref", "ref_src",
      ];
      const url = new URL(window.location.href);
      let mutated = false;
      for (const p of TRACKING_PARAMS) {
        if (url.searchParams.has(p)) { url.searchParams.delete(p); mutated = true; }
      }
      if (mutated) {
        const cleaned = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "") + url.hash;
        window.history.replaceState(window.history.state, "", cleaned);
      }
    } catch { /* noop — replaceState may be blocked in some WebViews */ }
  } catch (e) {
    console.warn("[RadioSphere] ad-landing tracking failed:", e);
  }
}
