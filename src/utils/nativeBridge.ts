/**
 * Native bridge helpers — keep ALL Capacitor / Android imports out of the
 * static web bundle. Everything here is dynamic and gated by `isNative()`.
 *
 * Rules:
 *  - Never `import` from `@capacitor/*` at the top level of a module that ships
 *    to the browser. Always go through this file or use `await import(...)`
 *    inside a function guarded by `isNative()`.
 *  - On the web, these helpers are no-ops and the Capacitor packages are
 *    tree-shaken out of the production bundle.
 */

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (window as any).Capacitor;
    return !!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
  } catch {
    return false;
  }
}

/** Dynamically register a Capacitor plugin. Returns null on the web. */
export async function loadCapacitorPlugin<T = unknown>(name: string): Promise<T | null> {
  if (!isNative()) return null;
  try {
    const mod = await import(/* @vite-ignore */ "@capacitor/core");
    return mod.registerPlugin<T>(name);
  } catch (e) {
    console.warn(`[RadioSphere] Failed to load Capacitor plugin "${name}":`, e);
    return null;
  }
}
