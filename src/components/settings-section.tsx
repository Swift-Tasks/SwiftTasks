"use client";

import { memo, useState, ReactNode } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  previewItems?: string[];
}

export const SettingsSection = memo(
  ({
    title,
    description,
    icon: Icon,
    iconClassName,
    children,
    defaultOpen = false,
    badge,
    previewItems,
  }: SettingsSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="bg-card dark:bg-card rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              className="w-full p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
              aria-expanded={isOpen}
            >
              <div className="flex items-start gap-3">
                {Icon && (
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      iconClassName ||
                        "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h2>
                    {badge}
                  </div>
                  {description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {description}
                    </p>
                  )}
                  {!isOpen && previewItems && previewItems.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {previewItems.join(" • ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-amber-500 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-neutral-800">
              <div className="pt-4">{children}</div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }
);

SettingsSection.displayName = "SettingsSection";
