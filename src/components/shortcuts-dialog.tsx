"use client";

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShortcutRow = memo(
  ({ keys, description }: { keys: string[]; description: string }) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600 dark:text-gray-400">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </div>
    </div>
  )
);

ShortcutRow.displayName = "ShortcutRow";

export const ShortcutsDialog = memo(
  ({ open, onOpenChange }: ShortcutsDialogProps) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="bg-white smooth_transition max-w-md"
          style={{ backgroundColor: "var(--dark-bg, white)" }}
        >
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Boost your productivity with these shortcuts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                General
              </h3>
              <div className="space-y-2">
                <ShortcutRow keys={["⌘", "S"]} description="Save changes" />
                <ShortcutRow keys={["⌘", "/"]} description="Show shortcuts" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                View Modes
              </h3>
              <div className="space-y-2">
                <ShortcutRow
                  keys={["⌘", "E"]}
                  description="Switch to Edit mode"
                />
                <ShortcutRow
                  keys={["⌘", "K"]}
                  description="Switch to Preview mode"
                />
                <ShortcutRow
                  keys={["⌘", "\\"]}
                  description="Switch to Split mode"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Formatting
              </h3>
              <div className="space-y-2">
                <ShortcutRow keys={["⌘", "B"]} description="Bold text" />
                <ShortcutRow keys={["⌘", "I"]} description="Italic text" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Font Size
              </h3>
              <div className="space-y-2">
                <ShortcutRow
                  keys={["⌘", "+"]}
                  description="Increase font size"
                />
                <ShortcutRow
                  keys={["⌘", "-"]}
                  description="Decrease font size"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 text-xs"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ShortcutsDialog.displayName = "ShortcutsDialog";
