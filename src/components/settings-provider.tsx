"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type FontFamily = "default" | "dyslexic" | "mono";
type FontSize = "normal" | "large" | "larger";
type ThemeMode = "light" | "dark";

interface UserSettings {
  autoCompleteExpired: boolean;
  autoCompleteAllTasks: boolean;
  showCompletedAssignments: boolean;
  fontFamily: FontFamily;
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;
  themeMode: ThemeMode;
  autoThemeEnabled: boolean;
  lightModeStart: string;
  lightModeEnd: string;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
  currentTheme: ThemeMode;
}

const defaultSettings: UserSettings = {
  autoCompleteExpired: false,
  autoCompleteAllTasks: false,
  showCompletedAssignments: true,
  fontFamily: "default",
  fontSize: "normal",
  reducedMotion: false,
  highContrast: false,
  themeMode: "light",
  autoThemeEnabled: true,
  lightModeStart: "07:00",
  lightModeEnd: "20:00",
};

const SettingsContext = createContext<SettingsContextType | null>(null);

// Helper to check if current time is within light mode hours
function isLightModeTime(start: string, end: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Apply font family and size to document
  useEffect(() => {
    const root = document.documentElement;

    // Font family
    root.classList.remove("font-dyslexic", "font-mono-accessibility");
    if (settings.fontFamily === "dyslexic") {
      root.classList.add("font-dyslexic");
    } else if (settings.fontFamily === "mono") {
      root.classList.add("font-mono-accessibility");
    }

    // Font size
    root.classList.remove("text-size-large", "text-size-larger");
    if (settings.fontSize === "large") {
      root.classList.add("text-size-large");
    } else if (settings.fontSize === "larger") {
      root.classList.add("text-size-larger");
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [settings]);

  // Handle theme changes
  useEffect(() => {
    const updateTheme = () => {
      let theme: ThemeMode;

      if (settings.autoThemeEnabled) {
        theme = isLightModeTime(settings.lightModeStart, settings.lightModeEnd)
          ? "light"
          : "dark";
      } else {
        theme = settings.themeMode;
      }

      setCurrentTheme(theme);

      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.style.colorScheme = theme;
      localStorage.setItem("theme", theme);
    };

    updateTheme();

    // Check every minute if auto theme is enabled
    let interval: NodeJS.Timeout | null = null;
    if (settings.autoThemeEnabled) {
      interval = setInterval(updateTheme, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    settings.autoThemeEnabled,
    settings.themeMode,
    settings.lightModeStart,
    settings.lightModeEnd,
  ]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setSettings((prev) => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, isLoading, currentTheme }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
