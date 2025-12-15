"use client";

import { useSettings } from "@/components/settings-provider";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { settings, updateSettings, currentTheme } = useSettings();

  const toggleTheme = () => {
    // If auto theme is enabled, disable it and set to opposite of current
    if (settings.autoThemeEnabled) {
      updateSettings({
        autoThemeEnabled: false,
        themeMode: currentTheme === "light" ? "dark" : "light",
      });
    } else {
      updateSettings({
        themeMode: currentTheme === "light" ? "dark" : "light",
      });
    }
  };

  const getIcon = () => {
    return currentTheme === "light" ? (
      <Sun className="w-4 h-4" />
    ) : (
      <Moon className="w-4 h-4" />
    );
  };

  const getLabel = () => {
    return currentTheme === "light" ? "Light Mode" : "Dark Mode";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:opacity-70 transition-opacity"
          aria-label="Toggle theme"
        >
          {getIcon()}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getLabel()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
