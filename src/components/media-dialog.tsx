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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MediaDialogProps {
  type: "image" | "link" | "gif";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  description: string;
  urlError: string;
  onUrlChange: (url: string) => void;
  onDescriptionChange: (description: string) => void;
  onInsert: () => void;
  onCancel: () => void;
}

export const MediaDialog = memo(
  ({
    type,
    open,
    onOpenChange,
    url,
    description,
    urlError,
    onUrlChange,
    onDescriptionChange,
    onInsert,
    onCancel,
  }: MediaDialogProps) => {
    const config = {
      image: {
        title: "Add Image",
        description: "Enter the image URL and an optional description.",
        urlLabel: "Image URL *",
        urlPlaceholder: "https://example.com/image.jpg",
        descLabel: "Description (optional)",
        descPlaceholder: "Image description",
      },
      link: {
        title: "Add Link",
        description: "Enter the link URL and an optional link text.",
        urlLabel: "URL *",
        urlPlaceholder: "https://example.com",
        descLabel: "Link Text (optional)",
        descPlaceholder: "Click here",
      },
      gif: {
        title: "Add GIF",
        description: "Enter the GIF URL and an optional description.",
        urlLabel: "GIF URL *",
        urlPlaceholder: "https://example.com/animation.gif",
        descLabel: "Description (optional)",
        descPlaceholder: "GIF description",
      },
    };

    const settings = config[type];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="bg-white smooth_transition"
          style={{ backgroundColor: "var(--dark-bg, white)" }}
        >
          <DialogHeader>
            <DialogTitle>{settings.title}</DialogTitle>
            <DialogDescription>{settings.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`${type}-url`}>{settings.urlLabel}</Label>
              <Input
                id={`${type}-url`}
                placeholder={settings.urlPlaceholder}
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
              />
              {urlError && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {urlError}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${type}-description`}>
                {settings.descLabel}
              </Label>
              <Input
                id={`${type}-description`}
                placeholder={settings.descPlaceholder}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={onInsert}
              disabled={!url}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

MediaDialog.displayName = "MediaDialog";
