/**
 * Theme Store
 * Manages dark/light/system theme with localStorage persistence
 * Applies theme to document element for Tailwind dark mode
 */

import { writable, derived, type Readable } from "svelte/store";
import { browser } from "$app/environment";
import type { Theme } from "../types";

const STORAGE_KEY = "sensor_theme";

// Get initial theme from localStorage or default to 'dark'
function getInitialTheme(): Theme {
    if (!browser) return "dark";
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved;
    }
    return "dark";
}

// Get system theme
function getSystemTheme(): "light" | "dark" {
    if (!browser) return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

// Create stores
export const theme = writable<Theme>(getInitialTheme());
export const systemTheme = writable<"light" | "dark">(getSystemTheme());

// Derived store for effective theme
export const effectiveTheme: Readable<"light" | "dark"> = derived(
    [theme, systemTheme],
    ([$theme, $systemTheme]) => {
        if ($theme === "system") {
            return $systemTheme;
        }
        return $theme;
    },
);

/**
 * Apply theme to document
 */
export function applyTheme(themeValue: "light" | "dark"): void {
    if (!browser) return;

    const root = document.documentElement;
    if (themeValue === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

/**
 * Set theme
 */
export function setTheme(newTheme: Theme): void {
    theme.set(newTheme);

    if (browser) {
        localStorage.setItem(STORAGE_KEY, newTheme);
    }

    // Apply immediately
    const effective = newTheme === "system" ? getSystemTheme() : newTheme;
    applyTheme(effective);
}

/**
 * Toggle between light and dark (ignores system)
 */
export function toggleTheme(): void {
    theme.update((current) => {
        const effective = current === "system" ? getSystemTheme() : current;
        const newTheme = effective === "light" ? "dark" : "light";
        setTheme(newTheme);
        return newTheme;
    });
}

/**
 * Cycle through themes: light -> dark -> system -> light
 */
export function cycleTheme(): void {
    theme.update((current) => {
        const themes: Theme[] = ["light", "dark", "system"];
        const currentIndex = themes.indexOf(current);
        const nextIndex = (currentIndex + 1) % themes.length;
        const newTheme = themes[nextIndex];
        setTheme(newTheme);
        return newTheme;
    });
}

// Subscribe to effectiveTheme changes and apply them
effectiveTheme.subscribe((effective) => {
    applyTheme(effective);
});

// Apply initial theme immediately
if (browser) {
    const initial = getInitialTheme();
    const effective = initial === "system" ? getSystemTheme() : initial;
    applyTheme(effective);
}

// Listen for system theme changes if in browser
if (browser) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
        systemTheme.set(e.matches ? "dark" : "light");
    });
}

// Convenience object for easier imports
export const themeStore = {
    theme,
    systemTheme,
    effectiveTheme,
    setTheme,
    toggle: toggleTheme,
    cycle: cycleTheme,
};
