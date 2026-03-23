"use client";

import { useState } from "react";
import { MoonStar } from "lucide-react";

const storageKey = "mailroom-theme";

type Theme = "light" | "dark";

export function ThemeToggle() {
  function readTheme(): Theme {
    if (typeof document === "undefined") {
      return "light";
    }

    const current = document.documentElement.dataset.theme;

    if (current === "light" || current === "dark") {
      return current;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  const [theme, setTheme] = useState<Theme>(() => readTheme());

  function applyTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="button-secondary w-[7.8rem] justify-between px-3 text-sm"
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
    >
      <span>Theme</span>
      <MoonStar className="h-4 w-4" />
    </button>
  );
}
