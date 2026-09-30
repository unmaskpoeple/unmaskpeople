"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("unmaskpeople_theme") as Theme;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("unmaskpeople_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const setExplicitTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("unmaskpeople_theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  // Render children immediately to avoid layout shift, but provide context
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setExplicitTheme }}>
      <div className={mounted ? "" : "dark"}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
