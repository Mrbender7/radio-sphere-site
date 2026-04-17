import type { RouteRecord } from "vite-react-ssg";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Render the same visual ErrorBoundary fallback when react-router catches
// a thrown/rejected error in a route (e.g. fetch returning HTML in a WebView).
function RouteErrorFallback() {
  return (
    <ErrorBoundary>
      {/* Force ErrorBoundary into its fallback state by throwing during render */}
      <ThrowToFallback />
    </ErrorBoundary>
  );
}

function ThrowToFallback(): never {
  throw new Error("Route error");
}

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: App,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, Component: () => null },
      { path: "search", Component: () => null },
      { path: "library", Component: () => null },
      { path: "about", Component: () => null },
      { path: "privacy", Component: () => null },
    ],
  },
];

// Routes to pre-render during SSG build
export const includedRoutes = ["/", "/search", "/library", "/about", "/privacy"];
