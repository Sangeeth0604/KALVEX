"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme/theme-provider";

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useMounted();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border-default bg-surface-raised text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${className}`}
      aria-label={
        mounted
          ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`
          : "Toggle theme"
      }
      title={
        mounted
          ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`
          : "Toggle theme"
      }
    >
      {!mounted ? (
        <span className="h-4 w-4 opacity-0" />
      ) : resolvedTheme === "dark" ? (
        /* Sun icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-accent transition-transform duration-200 hover:rotate-45"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        /* Moon icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-accent transition-transform duration-200 hover:-rotate-12"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {mounted ? (resolvedTheme === "dark" ? "Light" : "Dark") : "Theme"}
        </span>
      )}
    </button>
  );
}
