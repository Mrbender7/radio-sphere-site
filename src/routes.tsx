import type { RouteRecord } from "vite-react-ssg";
import App from "./App";

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: App,
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
