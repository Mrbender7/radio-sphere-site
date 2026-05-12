/**
 * Previously this module monkey-patched `ReactDOM.hydrateRoot` to inject an
 * `onRecoverableError` callback for Umami diagnostics. That approach broke the
 * SSG server build because ES module namespace objects are read-only under
 * Node/Vite ("Cannot assign to read only property 'hydrateRoot'").
 *
 * Hydration errors (#418/#421/#423/#425) are now stable in production and we
 * already capture them via `window.addEventListener('error')` and the
 * console.error wrapper in `main.tsx`, plus React ErrorBoundary components.
 * This file is kept as a no-op so the existing import in `main.tsx` doesn't
 * need to change.
 */
export {};
