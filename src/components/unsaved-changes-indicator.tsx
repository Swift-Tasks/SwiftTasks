"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";

interface UnsavedChangesIndicatorProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  updatedAt?: Date | string;
  onSave: () => void;
  onRevert: () => void;
}

export const UnsavedChangesIndicator = memo(
  ({
    hasUnsavedChanges,
    isSaving,
    updatedAt,
    onSave,
    onRevert,
  }: UnsavedChangesIndicatorProps) => {
    if (hasUnsavedChanges) {
      return (
        <div className="fixed bottom-6 left-6 flex flex-col gap-2 bg-card dark:bg-card border border-amber-400/30 dark:border-neutral-700 rounded-lg p-4 shadow-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
            {isSaving ? "Saving..." : "Unsaved changes"}
          </span>
          <div className="flex flex-row gap-2">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="h-8 px-4 text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={onRevert}
              disabled={isSaving}
              variant="ghost"
              className="h-8 px-4 text-xs disabled:opacity-50"
            >
              Revert
            </Button>
          </div>
        </div>
      );
    }

    if (updatedAt) {
      const formattedTime = new Date(updatedAt).toLocaleTimeString();
      return (
        <div className="fixed bottom-6 left-6 flex items-center gap-2 bg-card dark:bg-card border border-green-400/30 dark:border-neutral-700 rounded-lg px-4 py-2 shadow-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-900 dark:text-green-200">
            Saved {formattedTime}
          </span>
        </div>
      );
    }

    return null;
  }
);

UnsavedChangesIndicator.displayName = "UnsavedChangesIndicator";
