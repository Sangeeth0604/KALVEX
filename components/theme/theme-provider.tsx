"use client";

import React, {
  createContext,
  useContext,
  useSyncExternalStore,
  useCallback,
  useEffect,
  useTransition,
} from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "kalvex_theme";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // fallback
  }
  return "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);
  const [, startTransition] = useTransition();

  const applyThemeToDOM = useCallback((currentTheme: Theme) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    let active: ResolvedTheme = "dark";

    if (currentTheme === "system") {
      active = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      active = currentTheme;
    }

    root.classList.remove("light", "dark");
    root.classList.add(active);
    root.setAttribute("data-theme", active);
    root.style.colorScheme = active;
  }, []);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
        window.dispatchEvent(new Event("storage"));
      } catch {
        // Ignore storage failures
      }
      applyThemeToDOM(newTheme);
    },
    [applyThemeToDOM]
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system"
      ? typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const toggleTheme = useCallback(() => {
    const next: Theme = resolvedTheme === "dark" ? "light" : "dark";
    startTransition(() => {
      setTheme(next);
    });
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
