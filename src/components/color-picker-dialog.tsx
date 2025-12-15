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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

const colors = [
  { hex: "#f87171", name: "Red 400" },
  { hex: "#ef4444", name: "Red 500" },
  { hex: "#dc2626", name: "Red 600" },
  { hex: "#fb923c", name: "Orange 400" },
  { hex: "#f97316", name: "Orange 500" },
  { hex: "#ea580c", name: "Orange 600" },
  { hex: "#fbbf24", name: "Amber 400" },
  { hex: "#f59e0b", name: "Amber 500" },
  { hex: "#d97706", name: "Amber 600" },
  { hex: "#facc15", name: "Yellow 400" },
  { hex: "#eab308", name: "Yellow 500" },
  { hex: "#ca8a04", name: "Yellow 600" },
  { hex: "#a3e635", name: "Lime 400" },
  { hex: "#84cc16", name: "Lime 500" },
  { hex: "#65a30d", name: "Lime 600" },
  { hex: "#4ade80", name: "Green 400" },
  { hex: "#22c55e", name: "Green 500" },
  { hex: "#16a34a", name: "Green 600" },
  { hex: "#34d399", name: "Emerald 400" },
  { hex: "#10b981", name: "Emerald 500" },
  { hex: "#059669", name: "Emerald 600" },
  { hex: "#2dd4bf", name: "Teal 400" },
  { hex: "#14b8a6", name: "Teal 500" },
  { hex: "#0d9488", name: "Teal 600" },
  { hex: "#22d3ee", name: "Cyan 400" },
  { hex: "#06b6d4", name: "Cyan 500" },
  { hex: "#0891b2", name: "Cyan 600" },
  { hex: "#38bdf8", name: "Sky 400" },
  { hex: "#0ea5e9", name: "Sky 500" },
  { hex: "#0284c7", name: "Sky 600" },
  { hex: "#60a5fa", name: "Blue 400" },
  { hex: "#3b82f6", name: "Blue 500" },
  { hex: "#2563eb", name: "Blue 600" },
  { hex: "#818cf8", name: "Indigo 400" },
  { hex: "#6366f1", name: "Indigo 500" },
  { hex: "#4f46e5", name: "Indigo 600" },
  { hex: "#a78bfa", name: "Violet 400" },
  { hex: "#8b5cf6", name: "Violet 500" },
  { hex: "#7c3aed", name: "Violet 600" },
  { hex: "#c084fc", name: "Purple 400" },
  { hex: "#a855f7", name: "Purple 500" },
  { hex: "#9333ea", name: "Purple 600" },
  { hex: "#e879f9", name: "Fuchsia 400" },
  { hex: "#d946ef", name: "Fuchsia 500" },
  { hex: "#c026d3", name: "Fuchsia 600" },
  { hex: "#f472b6", name: "Pink 400" },
  { hex: "#ec4899", name: "Pink 500" },
  { hex: "#db2777", name: "Pink 600" },
  { hex: "#fb7185", name: "Rose 400" },
  { hex: "#f43f5e", name: "Rose 500" },
  { hex: "#e11d48", name: "Rose 600" },
  { hex: "#94a3b8", name: "Slate 400" },
  { hex: "#64748b", name: "Slate 500" },
  { hex: "#475569", name: "Slate 600" },
  { hex: "#9ca3af", name: "Gray 400" },
  { hex: "#6b7280", name: "Gray 500" },
  { hex: "#4b5563", name: "Gray 600" },
  { hex: "#000000", name: "Black" },
  { hex: "#ffffff", name: "White" },
];

export const ColorPickerDialog = memo(
  ({ open, onOpenChange, onColorSelect, onClose }: ColorPickerDialogProps) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="bg-white smooth_transition max-w-2xl"
          style={{ backgroundColor: "var(--dark-bg, white)" }}
        >
          <DialogHeader>
            <DialogTitle>Text Color</DialogTitle>
            <DialogDescription>
              Choose a color for the selected text.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-10 gap-2 py-4 max-h-96 overflow-y-auto">
            {colors.map((color) => (
              <Tooltip key={color.hex}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onColorSelect(color.hex)}
                    className={`h-10 rounded-md border-2 transition-colors ${
                      color.hex === "#ffffff"
                        ? "border-gray-900 hover:border-amber-600"
                        : "border-gray-200 hover:border-amber-600"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{color.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ColorPickerDialog.displayName = "ColorPickerDialog";
