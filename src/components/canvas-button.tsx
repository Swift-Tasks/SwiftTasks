"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { GraduationCap, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CanvasButtonProps {
  className?: string;
  disabled?: boolean;
  onSyncComplete?: () => void;
}

interface CanvasStatus {
  configured: boolean;
  apiUrl: string | null;
  lastSync: string | null;
  isMicrosoftUser?: boolean;
}

export const CanvasButton = memo(
  ({ className, disabled = false, onSyncComplete }: CanvasButtonProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [canvasStatus, setCanvasStatus] = useState<CanvasStatus | null>(null);
    const [apiUrl, setApiUrl] = useState("");
    const [apiToken, setApiToken] = useState("");

    const fetchCanvasStatus = useCallback(async () => {
      try {
        const res = await fetch("/api/canvas/sync");
        const data = await res.json();
        setCanvasStatus(data);
        if (data.apiUrl) {
          setApiUrl(data.apiUrl);
        }
      } catch (error) {
        console.error("Failed to fetch Canvas status:", error);
      }
    }, []);

    useEffect(() => {
      fetchCanvasStatus();
    }, [fetchCanvasStatus]);

    useEffect(() => {
      if (isOpen) {
        fetchCanvasStatus();
      }
    }, [isOpen, fetchCanvasStatus]);

    const handleSync = useCallback(async () => {
      if (!apiUrl || !apiToken) {
        toast.error("Canvas credentials required", {
          description: "Please enter your Canvas API URL and token",
        });
        return;
      }

      setIsProcessing(true);
      setIsOpen(false);

      const toastId = toast.loading("Syncing Canvas assignments...", {
        description: "This may take a moment.",
      });

      try {
        const response = await fetch("/api/canvas/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiUrl,
            apiToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to sync assignments");
        }

        const data = await response.json();

        toast.success("Canvas assignments synced!", {
          id: toastId,
          description: `Synced ${data.synced} new assignments, skipped ${data.skipped} existing`,
        });

        await fetchCanvasStatus();

        if (onSyncComplete) {
          onSyncComplete();
        }
      } catch (error: any) {
        console.error("Canvas sync error:", error);
        toast.error("Sync failed", {
          id: toastId,
          description: error.message || "Failed to sync Canvas assignments",
        });
      } finally {
        setIsProcessing(false);
      }
    }, [apiUrl, apiToken, onSyncComplete, fetchCanvasStatus]);

    const isDisabled = disabled || isProcessing;

    return (
      <div className={cn("relative", className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="primary"
              loading={isProcessing}
              disabled={isDisabled}
              className="gap-1.5 px-2.5 py-1.5 text-xs"
              aria-label="Sync Canvas assignments"
            >
              {!isProcessing && <GraduationCap className="w-3.5 h-3.5" />}
              <span>
                {isProcessing
                  ? "Syncing..."
                  : canvasStatus?.configured
                  ? "Sync Canvas"
                  : "Connect Canvas"}
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-96 p-0 bg-card dark:bg-card border border-gray-200 dark:border-neutral-700 shadow-lg z-50"
            align="end"
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    Canvas LMS Integration
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {canvasStatus?.lastSync && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-[var(--dark-bg)] border-b border-gray-200 dark:border-neutral-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Last synced:</span>{" "}
                    {new Date(canvasStatus.lastSync).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="p-4 space-y-4">
                {canvasStatus?.isMicrosoftUser ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                        ✓ Microsoft Account Detected
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                        Canvas assignments are automatically synced when you log
                        in using your Microsoft credentials.
                      </p>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        • Syncs all assignments from all your Canvas courses
                      </p>
                      <p>• Auto-syncs every 24 hours when you log in</p>
                      <p>• No manual configuration needed</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="canvas-url"
                        className="text-sm font-medium"
                      >
                        Canvas API URL
                      </Label>
                      <Input
                        id="canvas-url"
                        type="url"
                        placeholder="https://canvas.university.edu"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        disabled={isProcessing}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your institution's Canvas URL (without /api/v1)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="canvas-token"
                        className="text-sm font-medium"
                      >
                        Access Token
                      </Label>
                      <Input
                        id="canvas-token"
                        type="password"
                        placeholder="Enter your Canvas access token"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        disabled={isProcessing}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Generate from Canvas: Account → Settings → New Access
                        Token
                      </p>
                    </div>

                    <Button
                      onClick={handleSync}
                      disabled={isDisabled || !apiUrl || !apiToken}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Assignments
                        </>
                      )}
                    </Button>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        This will import all your Canvas assignments as tasks.
                        Existing assignments won't be duplicated.
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        💡 Tip: Log in with Microsoft for automatic Canvas sync!
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

CanvasButton.displayName = "CanvasButton";
