/**
 * Monkey-patches ReactDOM.hydrateRoot to inject an `onRecoverableError`
 * callback that forwards hydration mismatches (#418/#421/#423/#425/...) to
 * Umami WITH the React `componentStack` — the only reliable way to know which
 * component caused the mismatch in a production build.
 *
 * MUST be imported BEFORE `vite-react-ssg`, because that package destructures
 * `hydrateRoot` from a snapshot of the `react-dom` namespace at module init.
 * Mutating `ReactDOM.hydrateRoot` works because React 18 ships as CJS and Vite's
 * ESM interop exposes a mutable namespace object.
 */
import * as ReactDOM from "react-dom";

type UmamiWin = { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };

function trunc(s: string | undefined | null, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) : s;
}

function umamiTrack(event: string, data?: Record<string, unknown>): void {
  try {
    (window as unknown as UmamiWin).umami?.track(event, data);
  } catch {
    /* noop */
  }
}

/** Best-effort: pull the first non-DOM component frame out of a componentStack. */
function firstComponentFrame(stack: string | undefined | null): string {
  if (!stack) return "";
  for (const raw of stack.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // Skip lowercase HTML tag frames like "    at div" / "    at section"
    const m = /^at\s+([A-Za-z0-9_$.]+)/.exec(line);
    if (!m) continue;
    const name = m[1];
    if (/^[a-z]/.test(name)) continue; // DOM tag
    return name;
  }
  return "";
}

if (typeof window !== "undefined") {
  const RD = ReactDOM as unknown as {
    hydrateRoot?: (container: Element | Document, children: unknown, options?: Record<string, unknown>) => unknown;
  };
  const original = RD.hydrateRoot;
  if (typeof original === "function") {
    RD.hydrateRoot = function patchedHydrateRoot(container, children, options) {
      const userOpts = (options ?? {}) as {
        onRecoverableError?: (error: unknown, errorInfo: { digest?: string; componentStack?: string }) => void;
      };
      const merged = {
        ...userOpts,
        onRecoverableError(error: unknown, errorInfo: { digest?: string; componentStack?: string }) {
          try {
            const err = error as { message?: string; stack?: string; name?: string } | string | null | undefined;
            const message =
              typeof err === "string"
                ? err
                : err instanceof Error || (err && typeof (err as { message?: string }).message === "string")
                ? (err as { message?: string }).message ?? String(err)
                : String(err);
            const codeMatch = /Minified React error #(\d+)/.exec(message ?? "");
            const code = codeMatch ? codeMatch[1] : "";
            const componentStack = trunc(errorInfo?.componentStack, 2000);
            const culprit = firstComponentFrame(errorInfo?.componentStack);
            umamiTrack(code ? `hydration-recoverable-${code}` : "hydration-recoverable", {
              code: code || "unknown",
              culprit,
              digest: errorInfo?.digest ?? "",
              message: trunc(message, 300),
              componentStack,
              stack: trunc((err as { stack?: string })?.stack, 600),
              route: window.location.pathname,
              url: code ? `https://react.dev/errors/${code}` : "",
              ua: trunc(navigator.userAgent, 160),
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              dpr: window.devicePixelRatio,
              lang: navigator.language,
            });
          } catch {
            /* never break hydration */
          }
          try {
            userOpts.onRecoverableError?.(error, errorInfo);
          } catch {
            /* noop */
          }
        },
      };
      return original.call(this, container, children, merged);
    };
    console.log("[RadioSphere] hydrateRoot patched for diagnostic capture");
  } else {
    console.warn("[RadioSphere] hydrateRoot patch skipped (not found on react-dom)");
  }
}
