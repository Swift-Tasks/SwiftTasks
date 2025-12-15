"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { useSettings } from "@/components/settings-provider";
import { AIButton } from "@/components/ai-button";
import { CanvasButton } from "@/components/canvas-button";
import { ColorPickerDialog } from "@/components/color-picker-dialog";
import { MediaDialog } from "@/components/media-dialog";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { UnsavedChangesIndicator } from "@/components/unsaved-changes-indicator";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Editor from "@monaco-editor/react";
import { createMarkdownComponents } from "@/lib/markdown-components";
import { toast } from "sonner";
import {
  saveTaskContent,
  getTask,
  toggleTaskFinished,
  toggleTaskBookmarked,
} from "./actions";
import { useParams, useRouter } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/loading";
import {
  BoldIcon,
  ItalicIcon,
  Paintbrush,
  UnderlineIcon,
  ImageIcon,
  Link2Icon,
  FileImage,
  Eye,
  Edit,
  Columns2,
  RotateCcw,
  Info,
  ChevronRight,
  Upload,
  Download,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Bookmark,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentTheme } = useSettings();
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [viewMode, setViewMode] = useState<"edit" | "view" | "split">("view");
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [taskData, setTaskData] = useState<any>(null);

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [gifDialogOpen, setGifDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState("");
  const [dialogDescription, setDialogDescription] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [savedSelection, setSavedSelection] = useState<any>(null);
  const [urlError, setUrlError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [editorSelectedText, setEditorSelectedText] = useState("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId || !user) return;

      try {
        setIsLoading(true);
        const task = await getTask(taskId);
        setTaskData(task);
        setContent(task.body);
        setSavedContent(task.body);
        setInitialContent(task.body);
      } catch (error) {
        console.error("Error loading task:", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId, user, router]);

  useEffect(() => {
    setHasUnsavedChanges(content !== savedContent);
  }, [content, savedContent]);

  useEffect(() => {
    if (content !== savedContent && taskId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave(true);
      }, 3000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, savedContent, taskId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setViewMode("edit");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setViewMode("view");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setViewMode("split");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b" && viewMode === "edit") {
        e.preventDefault();
        insertMarkdown("**text**", "text");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i" && viewMode === "edit") {
        e.preventDefault();
        insertMarkdown("*text*", "text");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, content, savedContent, taskId]);

  const handleSave = useCallback(
    async (isAutoSave = false) => {
      if (!taskId || isSaving) return;

      const contentToSave = content;
      setIsSaving(true);

      setSavedContent(contentToSave);
      setHasUnsavedChanges(false);

      let retries = 0;
      const maxRetries = 3;

      const attemptSave = async (): Promise<void> => {
        try {
          await saveTaskContent(taskId, contentToSave);
          const updatedTask = await getTask(taskId);
          setTaskData(updatedTask);
          if (!isAutoSave) {
            toast.success("Changes saved successfully!");
          }
        } catch (error) {
          console.error("Error saving task:", error);

          if (retries < maxRetries) {
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
            return attemptSave();
          } else {
            setSavedContent(savedContent);
            setHasUnsavedChanges(true);
            toast.error(
              "Failed to save changes after multiple attempts. Please try again."
            );
          }
        } finally {
          setIsSaving(false);
        }
      };

      await attemptSave();
    },
    [taskId, content, isSaving, savedContent]
  );

  const handleRevert = useCallback(() => {
    setContent(savedContent);
    setHasUnsavedChanges(false);
    toast.info("Changes reverted");
  }, [savedContent]);

  const handleReset = useCallback(() => {
    setContent(initialContent);
    setSavedContent(initialContent);
    setHasUnsavedChanges(false);
    toast.info("Reset to initial state");
  }, [initialContent]);

  const insertMarkdown = useCallback(
    (syntax: string, placeholder: string = "text") => {
      if (editorRef.current) {
        const editor = editorRef.current;
        const selection = editor.getSelection();
        const selectedText =
          editor.getModel()?.getValueInRange(selection) || placeholder;

        let beforeSyntax = "";
        let afterSyntax = "";

        if (syntax.includes(placeholder)) {
          const parts = syntax.split(placeholder);
          beforeSyntax = parts[0] || "";
          afterSyntax = parts[1] || "";
        } else {
          const midPoint = Math.floor(syntax.length / 2);
          beforeSyntax = syntax.substring(0, midPoint);
          afterSyntax = syntax.substring(midPoint);
        }

        const markdown = beforeSyntax + selectedText + afterSyntax;

        const id = { major: 1, minor: 1 };
        const op = {
          identifier: id,
          range: selection,
          text: markdown,
          forceMoveMarkers: true,
        };
        editor.executeEdits("insert-markdown", [op]);

        const newSelection = {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn + beforeSyntax.length,
          endLineNumber: selection.endLineNumber,
          endColumn:
            selection.startColumn + beforeSyntax.length + selectedText.length,
        };
        editor.setSelection(newSelection);
        editor.focus();
      }
    },
    []
  );

  const handleDialogInsert = useCallback(
    (type: "image" | "link" | "gif") => {
      if (!dialogUrl) return;

      try {
        new URL(dialogUrl);
        setUrlError("");
      } catch {
        setUrlError("Please enter a valid URL (e.g., https://example.com)");
        return;
      }

      let markdown = "";
      const linkText =
        dialogDescription ||
        selectedText ||
        (type === "gif" ? "gif" : type === "image" ? "image" : "link");

      if (type === "image") {
        markdown = `![${linkText}](${dialogUrl})`;
      } else if (type === "link") {
        markdown = `[${linkText}](${dialogUrl})`;
      } else if (type === "gif") {
        markdown = `![${linkText}](${dialogUrl})`;
      }

      if (editorRef.current && savedSelection) {
        const editor = editorRef.current;
        const id = { major: 1, minor: 1 };
        const op = {
          identifier: id,
          range: savedSelection,
          text: markdown,
          forceMoveMarkers: true,
        };
        editor.executeEdits("insert-dialog", [op]);
        editor.focus();
      } else {
        const newContent = content + "\n" + markdown + "\n";
        setContent(newContent);
      }

      if (viewMode !== "edit" && viewMode !== "split") {
        setViewMode("edit");
      }

      setDialogUrl("");
      setDialogDescription("");
      setSelectedText("");
      setSavedSelection(null);
      setUrlError("");
      setImageDialogOpen(false);
      setLinkDialogOpen(false);
      setGifDialogOpen(false);
    },
    [dialogUrl, dialogDescription, selectedText, content, viewMode]
  );

  const handleImportFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
        toast.error("Please select a markdown file (.md or .markdown)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        toast.success(`Imported ${file.name}`);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsText(file);

      event.target.value = "";
    },
    []
  );

  const handleExportFile = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = `${taskData?.name || "task"}.md`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${fileName}`);
  }, [content, taskData]);

  const toggleFinished = useCallback(async () => {
    if (!taskId || !taskData) return;

    try {
      const result = await toggleTaskFinished(taskId);
      const updatedTask = await getTask(taskId);
      setTaskData(updatedTask);
      toast.success(
        result.finished
          ? "Task marked as completed"
          : "Task marked as incomplete"
      );
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task status");
    }
  }, [taskId, taskData]);

  const toggleBookmarked = useCallback(async () => {
    if (!taskId || !taskData) return;

    try {
      const result = await toggleTaskBookmarked(taskId);
      const updatedTask = await getTask(taskId);
      setTaskData(updatedTask);
      toast.success(result.bookmarked ? "Task bookmarked" : "Bookmark removed");
    } catch (error) {
      console.error("Error toggling task bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  }, [taskId, taskData]);

  const handleHighlightInsert = useCallback(
    (color: string) => {
      if (editorRef.current && savedSelection) {
        const editor = editorRef.current;
        const selectedText =
          editor.getModel()?.getValueInRange(savedSelection) || "text";
        const markdown = `<span style="color: ${color}">${selectedText}</span>`;

        const id = { major: 1, minor: 1 };
        const op = {
          identifier: id,
          range: savedSelection,
          text: markdown,
          forceMoveMarkers: true,
        };
        editor.executeEdits("insert-highlight", [op]);
        editor.focus();
      }

      if (viewMode !== "edit" && viewMode !== "split") {
        setViewMode("edit");
      }

      setSelectedText("");
      setSavedSelection(null);
      setHighlightDialogOpen(false);
    },
    [savedSelection, viewMode]
  );

  const wordCount = useMemo(() => {
    return content.split(/\s+/).filter(Boolean).length;
  }, [content]);

  const editorOptions = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: fontSize,
      lineNumbers: "on" as const,
      roundedSelection: true,
      scrollBeyondLastLine: false,
      wordWrap: "on" as const,
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      tabSize: 2,
    }),
    [fontSize]
  );

  return (
    <ProtectedRoute>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col gap-3 h-[calc(100vh-8rem)]">
              {/* Top bar with info and buttons */}
              <div className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="text-gray-600 dark:text-gray-300 cursor-pointer hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                      onClick={() => {
                        if (taskData?.assignment?.id) {
                          router.push(`/dashboard/${taskData.assignment.id}`);
                        }
                      }}
                      title={taskData?.assignment?.name}
                    >
                      {(taskData?.assignment?.name || "Assignment").length > 43
                        ? (taskData?.assignment?.name || "Assignment").slice(
                            0,
                            43
                          ) + "…"
                        : taskData?.assignment?.name || "Assignment"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span
                      className="font-medium text-gray-900 dark:text-white"
                      title={taskData?.name}
                    >
                      {(taskData?.name || "Task").length > 43
                        ? (taskData?.name || "Task").slice(0, 43) + "…"
                        : taskData?.name || "Task"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {taskData?.updatedAt
                        ? new Date(taskData.updatedAt).toLocaleDateString()
                        : ""}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-600 dark:text-gray-300 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p>
                            <span className="font-semibold">Deadline:</span>{" "}
                            {taskData?.deadline
                              ? new Date(taskData.deadline).toLocaleDateString()
                              : "No deadline"}
                          </p>
                          <p>
                            <span className="font-semibold">Word Count:</span>{" "}
                            {wordCount} words
                          </p>
                          <p>
                            <span className="font-semibold">Last Updated:</span>{" "}
                            {taskData?.updatedAt
                              ? new Date(taskData.updatedAt).toLocaleString()
                              : "Unknown"}
                          </p>
                          <p>
                            <span className="font-semibold">Status:</span>{" "}
                            {taskData?.finished ? "Completed" : "In Progress"}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle
                          className="w-4 h-4 text-gray-600 dark:text-white cursor-pointer"
                          onClick={() => setShortcutsDialogOpen(true)}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Keyboard Shortcuts</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex gap-2">
                 
                  <AIButton
                    content={content}
                    selectedText={editorSelectedText}
                    onContentUpdate={(newContent) => {
                      setContent(newContent);
                      if (editorRef.current) {
                        editorRef.current.setValue(newContent);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-row justify-center items-center bg-card dark:bg-card p-3 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm gap-3 w-full">
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => setViewMode("edit")}
                  >
                    <Edit
                      className={`w-[15px] ${
                        viewMode === "edit"
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Edit Mode</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => setViewMode("view")}
                  >
                    <Eye
                      className={`w-[15px] ${
                        viewMode === "view"
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>View Mode</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => setViewMode("split")}
                  >
                    <Columns2
                      className={`w-[15px] ${
                        viewMode === "split"
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Split View</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={toggleFinished}
                  >
                    <Check
                      className={`w-[15px] ${
                        taskData?.finished
                          ? "text-green-600 dark:text-green-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      {taskData?.finished ? "Mark Incomplete" : "Mark Complete"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={toggleBookmarked}
                  >
                    <Bookmark
                      className={`w-[15px] ${
                        taskData?.bookmarked
                          ? "text-amber-600 fill-amber-600 dark:text-amber-500 dark:fill-amber-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      {taskData?.bookmarked
                        ? "Remove Bookmark"
                        : "Add Bookmark"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => insertMarkdown("**text**", "text")}
                  >
                    <BoldIcon className="w-[15px] text-black dark:text-white" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Bold</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => insertMarkdown("*text*", "text")}
                  >
                    <ItalicIcon className="w-[15px] text-black dark:text-white" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Italic</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => insertMarkdown("~~text~~", "text")}
                  >
                    <UnderlineIcon className="w-[15px] text-black dark:text-white" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Strikethrough</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => {
                      if (editorRef.current) {
                        const selection = editorRef.current.getSelection();
                        const selectedText = editorRef.current
                          .getModel()
                          ?.getValueInRange(selection);
                        setSelectedText(selectedText || "");
                        setSavedSelection(selection);
                      }
                      setHighlightDialogOpen(true);
                    }}
                  >
                    <Paintbrush className="w-[15px] text-black dark:text-white" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Color Text</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => {
                      if (editorRef.current) {
                        const selection = editorRef.current.getSelection();
                        const selectedText = editorRef.current
                          .getModel()
                          ?.getValueInRange(selection);
                        setSelectedText(selectedText || "");
                        setSavedSelection(selection);
                      }
                      setImageDialogOpen(true);
                    }}
                  >
                    <ImageIcon className="w-[15px] text-black dark:text-white" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add Image</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => {
                      if (editorRef.current) {
                        const selection = editorRef.current.getSelection();
                        const selectedText = editorRef.current
                          .getModel()
                          ?.getValueInRange(selection);
                        setSelectedText(selectedText || "");
                        setDialogDescription(selectedText || "");
                        setSavedSelection(selection);
                      }
                      setLinkDialogOpen(true);
                    }}
                  >
                    <Link2Icon className="w-[15px] text-black dark:text-white" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add Link</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => {
                      if (editorRef.current) {
                        const selection = editorRef.current.getSelection();
                        const selectedText = editorRef.current
                          .getModel()
                          ?.getValueInRange(selection);
                        setSelectedText(selectedText || "");
                        setSavedSelection(selection);
                      }
                      setGifDialogOpen(true);
                    }}
                  >
                    <FileImage className="w-[15px] text-black dark:text-white" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add GIF</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => setFontSize((prev) => Math.max(prev - 2, 8))}
                  >
                    <ZoomOut className="w-[15px] text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Decrease Font Size</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() =>
                      setFontSize((prev) => Math.min(prev + 2, 32))
                    }
                  >
                    <ZoomIn className="w-[15px] text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Increase Font Size</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={() => setFontSize(14)}
                  >
                    <RotateCw className="w-[15px] text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Reset Font Size</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-[15px] text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Reset to Initial State</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={handleImportFile}
                  >
                    <Upload className="w-[15px] text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Import Markdown File</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="cursor-pointer smooth_transition"
                    asChild
                    onClick={handleExportFile}
                  >
                    <Download className="w-[15px] text-gray-600 dark:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Export Markdown File</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex-1 bg-card dark:bg-card rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                {viewMode === "edit" && (
                  <Editor
                    height="100%"
                    defaultLanguage="markdown"
                    value={content}
                    onChange={(value) => setContent(value || "")}
                    onMount={(editor) => {
                      editorRef.current = editor;
                      editor.onDidChangeCursorSelection(() => {
                        const selection = editor.getSelection();
                        if (selection) {
                          const selectedText =
                            editor.getModel()?.getValueInRange(selection) || "";
                          setEditorSelectedText(selectedText);
                        }
                      });
                    }}
                    theme={currentTheme === "dark" ? "vs-dark" : "light"}
                    options={editorOptions}
                  />
                )}

                {viewMode === "view" && (
                  <div className="w-full h-full overflow-y-auto p-4 bg-white dark:bg-[oklch(0.228_0.013_286.375)]">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none dark:prose-headings:text-gray-100 dark:prose-p:text-gray-200 dark:prose-li:text-gray-200 dark:prose-strong:text-gray-100 dark:prose-code:text-gray-100 dark:prose-a:text-amber-400"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={createMarkdownComponents(
                          currentTheme === "dark"
                        )}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {viewMode === "split" && (
                  <div className="flex h-full">
                    <div className="w-1/2 border-r border-gray-200 dark:border-neutral-700">
                      <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={content}
                        onChange={(value) => setContent(value || "")}
                        onMount={(editor) => {
                          editorRef.current = editor;
                          editor.onDidChangeCursorSelection(() => {
                            const selection = editor.getSelection();
                            if (selection) {
                              const selectedText =
                                editor.getModel()?.getValueInRange(selection) ||
                                "";
                              setEditorSelectedText(selectedText);
                            }
                          });
                        }}
                        theme={currentTheme === "dark" ? "vs-dark" : "light"}
                        options={editorOptions}
                      />
                    </div>
                    <div className="w-1/2 overflow-y-auto p-4 bg-white dark:bg-[oklch(0.228_0.013_286.375)]">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none dark:prose-headings:text-gray-100 dark:prose-p:text-gray-200 dark:prose-li:text-gray-200 dark:prose-strong:text-gray-100 dark:prose-code:text-gray-100 dark:prose-a:text-amber-400"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={createMarkdownComponents(
                            currentTheme === "dark"
                          )}
                        >
                          {content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <UnsavedChangesIndicator
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            updatedAt={taskData?.updatedAt}
            onSave={() => handleSave()}
            onRevert={handleRevert}
          />

          <ShortcutsDialog
            open={shortcutsDialogOpen}
            onOpenChange={setShortcutsDialogOpen}
          />

          <ColorPickerDialog
            open={highlightDialogOpen}
            onOpenChange={setHighlightDialogOpen}
            onColorSelect={handleHighlightInsert}
            onClose={() => {
              setHighlightDialogOpen(false);
              setSavedSelection(null);
              setSelectedText("");
            }}
          />

          <MediaDialog
            type="image"
            open={imageDialogOpen}
            onOpenChange={setImageDialogOpen}
            url={dialogUrl}
            description={dialogDescription}
            urlError={urlError}
            onUrlChange={(url) => {
              setDialogUrl(url);
              setUrlError("");
            }}
            onDescriptionChange={setDialogDescription}
            onInsert={() => handleDialogInsert("image")}
            onCancel={() => {
              setImageDialogOpen(false);
              setDialogUrl("");
              setDialogDescription("");
              setSavedSelection(null);
              setUrlError("");
            }}
          />

          <MediaDialog
            type="link"
            open={linkDialogOpen}
            onOpenChange={setLinkDialogOpen}
            url={dialogUrl}
            description={dialogDescription}
            urlError={urlError}
            onUrlChange={(url) => {
              setDialogUrl(url);
              setUrlError("");
            }}
            onDescriptionChange={setDialogDescription}
            onInsert={() => handleDialogInsert("link")}
            onCancel={() => {
              setLinkDialogOpen(false);
              setDialogUrl("");
              setDialogDescription("");
              setSavedSelection(null);
              setUrlError("");
            }}
          />

          <MediaDialog
            type="gif"
            open={gifDialogOpen}
            onOpenChange={setGifDialogOpen}
            url={dialogUrl}
            description={dialogDescription}
            urlError={urlError}
            onUrlChange={(url) => {
              setDialogUrl(url);
              setUrlError("");
            }}
            onDescriptionChange={setDialogDescription}
            onInsert={() => handleDialogInsert("gif")}
            onCancel={() => {
              setGifDialogOpen(false);
              setDialogUrl("");
              setDialogDescription("");
              setSavedSelection(null);
              setUrlError("");
            }}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
