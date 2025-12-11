"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getIcon = () => {
    return theme === "light" ? (
      <Sun className="w-4 h-4" />
    ) : (
      <Moon className="w-4 h-4" />
    );
  };

  const getLabel = () => {
    return theme === "light" ? "Light Mode" : "Dark Mode";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-foreground/10 transition-colors"
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
