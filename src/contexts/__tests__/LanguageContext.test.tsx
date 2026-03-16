import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LanguageProvider, useTranslation } from "@/contexts/LanguageContext";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("LanguageContext", () => {
  it("provides translation function", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(result.current.t("nav.home")).toBeTruthy();
    expect(result.current.t("nav.home")).not.toBe("nav.home");
  });

  it("changes language", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    act(() => result.current.setLanguage("en"));
    expect(result.current.language).toBe("en");
    expect(result.current.t("nav.home")).toBe("Home");
  });

  it("persists language to localStorage", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    act(() => result.current.setLanguage("es"));
    expect(localStorage.getItem("radiosphere_language")).toBe("es");
  });

  it("returns key for missing translations", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
  });
});
