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
  } catch (e) {
    console.warn("[RadioSphere] ad-landing tracking failed:", e);
  }
}
