"use client";

import { useState, useRef, useCallback, memo, useEffect } from "react";
import { Sparkles, Send, X } from "lucide-react";
import { toast } from "sonner";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AIButtonProps {
  content: string;
  selectedText?: string;
  onContentUpdate: (newContent: string) => void;
  className?: string;
  disabled?: boolean;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface UsageStats {
  used: number;
  remaining: number;
  limit: number;
  resetsAt: number | null;
}

export const AIButton = memo(
  ({
    content,
    selectedText,
    onContentUpdate,
    className,
    disabled = false,
  }: AIButtonProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchUsage = useCallback(async () => {
      try {
        const res = await fetch("/api/ollama");
        const data = await res.json();
        setIsConfigured(data.configured);
        if (data.usage) {
          setUsage(data.usage);
        }
      } catch (error) {
        setIsConfigured(false);
      }
    }, []);

    useEffect(() => {
      fetchUsage();
    }, [fetchUsage]);

    useEffect(() => {
      if (isOpen) {
        fetchUsage();
      }
    }, [isOpen, fetchUsage]);

    const isDisabled = disabled || !isConfigured;

    const handleAIRequest = useCallback(
      async (userPrompt?: string) => {
        if (!isConfigured) {
          toast.error("Ollama not configured", {
            description:
              "Please set OLLAMA_URL in your .env file on the server",
          });
          return;
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        const textToProcess = selectedText?.trim() || content;

        if (!textToProcess) {
          toast.error("No content to process", {
            description:
              "Please provide some content or select text to improve.",
          });
          return;
        }

        setIsProcessing(true);
        setIsOpen(false);
        abortControllerRef.current = new AbortController();

        const toastId = toast.loading("AI is analyzing your content...", {
          description: "This may take a moment.",
        });

        try {
          let prompt: string;

          const systemInstructions = `CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:

1. Return ONLY the raw markdown content - NO code blocks, NO formatting wrappers
2. DO NOT wrap your response in \`\`\`markdown or any other code fence
3. DO NOT include phrases like "Here's the improved version" or "I've enhanced"
4. DO NOT add any explanations or commentary outside the markdown itself
5. For ANY explanations, use ONLY HTML comments: <!-- explanation here -->
6. Start your first line with actual markdown content (heading, text, or comment)
7. End your last line with actual markdown content - no trailing explanations

WRONG - DO NOT DO THIS:
\`\`\`markdown
# Heading
Content here
\`\`\`

WRONG - DO NOT DO THIS:
Here's the improved version:
# Heading
Content here

CORRECT - DO THIS:
<!-- Improved clarity and structure -->
# Heading
Content here

CORRECT - DO THIS:
# Task Overview
<!-- Fixed grammar: changed "utilize" to "use" -->
This document uses simple language.

CORRECT - DO THIS:
## Goals
- Complete authentication
<!-- Suggestion: Add 2FA for better security -->
- Deploy to production

NOW PROCESS THE CONTENT BELOW. OUTPUT ONLY RAW MARKDOWN:`;

          if (userPrompt && userPrompt.trim()) {
            prompt = `${systemInstructions}\n\nUSER REQUEST: ${userPrompt}\n\nCONTENT TO PROCESS:\n${textToProcess}`;
          } else if (selectedText) {
            prompt = `${systemInstructions}\n\nTASK: Improve and enhance the following text. Make it more clear, professional, and well-structured. Use HTML comments for any explanations.\n\nCONTENT TO PROCESS:\n${selectedText}`;
          } else {
            prompt = `${systemInstructions}\n\nTASK: Review and improve the following markdown content. Enhance clarity, fix any issues, improve structure, and add suggestions using HTML comments where appropriate.\n\nCONTENT TO PROCESS:\n${content}`;
          }

          const response = await fetch("/api/ollama", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const errorData = await response.json();

            if (response.status === 401) {
              throw new Error("You must be logged in to use AI features");
            } else if (response.status === 429) {
              if (errorData.used !== undefined) {
                setUsage({
                  used: errorData.used,
                  remaining: errorData.remaining,
                  limit: errorData.limit,
                  resetsAt: errorData.resetsAt,
                });
              }
              const hours = Math.floor((errorData.retryAfter || 0) / 3600);
              const minutes = Math.floor(
                ((errorData.retryAfter || 0) % 3600) / 60
              );
              const timeStr =
                hours > 0
                  ? `${hours}h ${minutes}m`
                  : `${minutes || 1} minute(s)`;
              throw new Error(
                `Daily limit reached (${errorData.used}/${errorData.limit}). Resets in ${timeStr}.`
              );
            }

            throw new Error(
              errorData.message || `API error: ${response.status}`
            );
          }

          if (!response.body) {
            throw new Error("No response body from API");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedResponse = "";

          toast.loading("AI is generating suggestions...", {
            id: toastId,
            description: "Streaming response",
          });

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              try {
                const json: OllamaResponse = JSON.parse(line);
                if (json.response) {
                  accumulatedResponse += json.response;
                }
              } catch (e) {
                console.warn("Failed to parse JSON line:", line);
              }
            }
          }

          if (!accumulatedResponse.trim()) {
            throw new Error("No response generated from AI");
          }

          let cleanedResponse = accumulatedResponse.trim();

          const codeBlockPattern = /^```(?:markdown)?\s*\n([\s\S]*?)\n```$/;
          const match = cleanedResponse.match(codeBlockPattern);
          if (match) {
            cleanedResponse = match[1].trim();
          }

          cleanedResponse = cleanedResponse.replace(
            /^```(?:markdown)?\s*\n/,
            ""
          );
          cleanedResponse = cleanedResponse.replace(/\n```\s*$/, "");

          const lines = cleanedResponse.split("\n");
          let startIndex = 0;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (
              line.startsWith("#") ||
              line.startsWith("-") ||
              line.startsWith("*") ||
              line.startsWith(">") ||
              line.startsWith("<!--") ||
              line.match(/^\d+\./) ||
              line.match(/^[A-Z]/) ||
              line.length === 0
            ) {
              startIndex = i;
              break;
            }
          }

          if (startIndex > 0) {
            cleanedResponse = lines.slice(startIndex).join("\n").trim();
          }

          if (selectedText) {
            const newContent = content.replace(selectedText, cleanedResponse);
            onContentUpdate(newContent);
          } else {
            onContentUpdate(cleanedResponse);
          }

          await fetchUsage();

          toast.success("AI suggestions applied!", {
            id: toastId,
            description: selectedText
              ? "Selected text has been improved"
              : "Task content has been enhanced",
          });
        } catch (error: any) {
          if (error.name === "AbortError") {
            toast.info("AI request cancelled", {
              id: toastId,
            });
          } else {
            console.error("AI API error:", error);

            const errorMessage = error.message || "Unknown error occurred";
            const isConnectionError =
              errorMessage.includes("fetch") ||
              errorMessage.includes("network") ||
              errorMessage.includes("ECONNREFUSED") ||
              errorMessage.includes("connect to Ollama");

            toast.error("AI request failed", {
              id: toastId,
              description: errorMessage,
              action: isConnectionError
                ? {
                    label: "Help",
                    onClick: () => {
                      window.open("https://ollama.ai/download", "_blank");
                    },
                  }
                : undefined,
            });
          }
        } finally {
          setIsProcessing(false);
          abortControllerRef.current = null;
          fetchUsage();
        }
      },
      [content, selectedText, onContentUpdate, isConfigured, fetchUsage]
    );

    const handleSendPrompt = useCallback(() => {
      if (customPrompt.trim()) {
        handleAIRequest(customPrompt);
        setCustomPrompt("");
      } else {
        handleAIRequest();
      }
    }, [customPrompt, handleAIRequest]);

    const formatTimeRemaining = (resetsAt: number | null) => {
      if (!resetsAt) return "24 hours";
      const now = Date.now();
      const diff = resetsAt - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    const handleUnmount = useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, []);

    if (typeof window !== "undefined") {
      const { useEffect } = require("react");
      useEffect(() => {
        return handleUnmount;
      }, [handleUnmount]);
    }

    return (
      <div className={cn("relative inline-block", className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div>
              <GlowingEffect
                spread={40}
                borderWidth={2}
                glow={true}
                disabled={false}
                className="rounded-md"
                proximity={64}
                inactiveZone={0.01}
              />
              <button
                disabled={isDisabled || isProcessing}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md",
                  "bg-white dark:bg-white text-gray-900",
                  "font-medium text-xs",
                  "transition-all duration-200",
                  "hover:bg-gray-50 dark:hover:bg-gray-100",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-200",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400",
                  "shadow-sm hover:shadow-md cursor-pointer",
                  isProcessing && "animate-pulse",
                  !isConfigured && "grayscale"
                )}
                aria-label={
                  !isConfigured
                    ? "AI features disabled - Ollama not configured"
                    : selectedText
                    ? "Improve selected text with AI"
                    : "Improve task with AI"
                }
                title={
                  !isConfigured
                    ? "Set OLLAMA_URL in .env to enable AI features"
                    : undefined
                }
              >
                <Sparkles
                  className={cn("w-3.5 h-3.5", isProcessing && "animate-spin")}
                />
                <span>
                  {isConfigured === null
                    ? "Loading..."
                    : !isConfigured
                    ? "AI Disabled"
                    : isProcessing
                    ? "Processing..."
                    : selectedText
                    ? "AI Improve Selection"
                    : "AI Suggestions"}
                </span>
              </button>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-80 p-0 bg-white dark:bg-[var(--dark-bg)] border border-gray-200 dark:border-neutral-700 shadow-lg z-50"
            align="end"
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    AI Assistant
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {usage && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-[var(--dark-bg)] border-b border-gray-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Daily Usage
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        usage.remaining > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {usage.remaining} / {usage.limit} remaining
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        usage.remaining > usage.limit / 2
                          ? "bg-green-500"
                          : usage.remaining > 0
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                      style={{
                        width: `${(usage.used / usage.limit) * 100}%`,
                      }}
                    />
                  </div>
                  {usage.remaining === 0 && usage.resetsAt && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Resets in {formatTimeRemaining(usage.resetsAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="px-3 py-2 bg-gray-50 dark:bg-[var(--dark-bg)] text-xs text-gray-600 dark:text-gray-400">
                {selectedText ? (
                  <p>
                    <span className="font-medium">Selected text:</span>{" "}
                    {selectedText.substring(0, 50)}
                    {selectedText.length > 50 ? "..." : ""}
                  </p>
                ) : (
                  <p>
                    <span className="font-medium">Full content</span> will be
                    analyzed
                  </p>
                )}
              </div>

              <div className="p-3">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder="Custom instructions (optional)..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[var(--dark-bg)] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  rows={3}
                  disabled={isProcessing || usage?.remaining === 0}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {customPrompt
                      ? "Custom prompt will be used"
                      : "Default: Improve & enhance"}
                  </p>
                  <Button
                    onClick={handleSendPrompt}
                    disabled={
                      isProcessing || !isConfigured || usage?.remaining === 0
                    }
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 h-auto"
                  >
                    {isProcessing ? (
                      <>
                        <Sparkles className="w-3 h-3 mr-1.5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-1.5" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

AIButton.displayName = "AIButton";
