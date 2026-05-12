import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after the first client mount.
 *
 * On the server / SSG build, this returns `fallback` (default: `null`), so the
 * generated HTML doesn't depend on any browser-only state (localStorage,
 * navigator, window, Intl, Date, random IDs, etc.). On the client, the same
 * `fallback` is rendered for the first paint to keep hydration byte-identical
 * with the SSG output, then `children` swap in inside an effect.
 *
 * Use this to isolate components whose first render could legitimately differ
 * between SSG and the client and would otherwise cause React hydration
 * mismatches (#418/#421/#423/#425).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return <>{mounted ? children : fallback}</>;
}
