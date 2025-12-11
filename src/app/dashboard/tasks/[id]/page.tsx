"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { AIButton } from "@/components/ai-button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
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
  const { theme } = useTheme();
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
          <Navbar />

          <div className="flex flex-col w-full gap-1 h-full items-center justify-center mt-4">
            <div className="flex flex-col gap-2  w-[90%] h-[82vh] p-3 rounded-md">
              <div className="flex justify-end mb-1">
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
              <div className="flex flex-row justify-between items-center bg-white dark:bg-[var(--dark-bg)] p-3 rounded-md border border-black/10 dark:border-neutral-700 shadow-sm gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="text-gray-600 dark:text-gray-300 cursor-pointer hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                      onClick={() => {
                        if (taskData?.assignment?.id) {
                          router.push(`/dashboard/${taskData.assignment.id}`);
                        }
                      }}
                    >
                      {taskData?.assignment?.name || "Assignment"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {taskData?.name || "Task"}
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

                <div className="flex flex-row gap-3 items-center">
                  <Tooltip>
                    <TooltipTrigger
                      className="cursor-pointer smooth_transition"
                      asChild
                      onClick={() => setViewMode("edit")}
                    >
                      <Edit
                        className={`w-[15px] ${
                          viewMode === "edit"
                            ? "text-amber-600"
                            : "text-gray-600"
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
                            ? "text-amber-600"
                            : "text-gray-600"
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
                            ? "text-amber-600"
                            : "text-gray-600"
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
                        {taskData?.finished
                          ? "Mark Incomplete"
                          : "Mark Complete"}
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
                      onClick={() =>
                        setFontSize((prev) => Math.max(prev - 2, 8))
                      }
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
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex-1 bg-white dark:bg-[var(--dark-bg)] rounded-md border border-black/10 dark:border-neutral-700 shadow-sm overflow-hidden">
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
                    theme={theme === "dark" ? "vs-dark" : "light"}
                    options={editorOptions}
                  />
                )}

                {viewMode === "view" && (
                  <div className="w-full h-full overflow-y-auto p-4 bg-white dark:bg-[var(--dark-bg-deep)]">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none dark:prose-headings:text-gray-100 dark:prose-p:text-gray-200 dark:prose-li:text-gray-200 dark:prose-strong:text-gray-100 dark:prose-code:text-gray-100 dark:prose-a:text-amber-400"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={createMarkdownComponents(theme === "dark")}
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
                        theme={theme === "dark" ? "vs-dark" : "light"}
                        options={editorOptions}
                      />
                    </div>
                    <div className="w-1/2 overflow-y-auto p-4 bg-white dark:bg-[var(--dark-bg-deep)]">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none dark:prose-headings:text-gray-100 dark:prose-p:text-gray-200 dark:prose-li:text-gray-200 dark:prose-strong:text-gray-100 dark:prose-code:text-gray-100 dark:prose-a:text-amber-400"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={createMarkdownComponents(
                            theme === "dark"
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

          {hasUnsavedChanges && (
            <div className="fixed bottom-6 left-6 flex flex-col gap-2 bg-white dark:bg-[var(--dark-bg)] border border-amber-400/30 dark:border-neutral-700 rounded-lg p-4 shadow-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                {isSaving ? "Saving..." : "Unsaved changes"}
              </span>
              <div className="flex flex-row gap-2">
                <Button
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="h-8 px-4 text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleRevert}
                  disabled={isSaving}
                  variant="ghost"
                  className="h-8 px-4 text-xs disabled:opacity-50"
                >
                  Revert
                </Button>
              </div>
            </div>
          )}

          {!hasUnsavedChanges && taskData?.updatedAt && (
            <div className="fixed bottom-6 left-6 flex items-center gap-2 bg-white dark:bg-[var(--dark-bg)] border border-green-400/30 dark:border-neutral-700 rounded-lg px-4 py-2 shadow-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-900 dark:text-green-200">
                Saved {new Date(taskData.updatedAt).toLocaleTimeString()}
              </span>
            </div>
          )}

          <Dialog
            open={shortcutsDialogOpen}
            onOpenChange={setShortcutsDialogOpen}
          >
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
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Save
                      </span>
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>S</Kbd>
                      </KbdGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    View Modes
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Edit Mode
                      </span>
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>E</Kbd>
                      </KbdGroup>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        View Mode
                      </span>
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>K</Kbd>
                      </KbdGroup>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Split Mode
                      </span>
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>\\</Kbd>
                      </KbdGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Formatting
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Bold
                      </span>
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>B</Kbd>
                      </KbdGroup>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Italic
                      </span>
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>I</Kbd>
                      </KbdGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Font Size
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Increase
                      </span>
                      <KbdGroup>
                        <Kbd>⌥</Kbd>
                        <Kbd>=</Kbd>
                      </KbdGroup>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Decrease
                      </span>
                      <KbdGroup>
                        <Kbd>⌥</Kbd>
                        <Kbd>-</Kbd>
                      </KbdGroup>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setShortcutsDialogOpen(false)}
                  className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 text-xs"
                >
                  Got it
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={highlightDialogOpen}
            onOpenChange={setHighlightDialogOpen}
          >
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#f87171")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#f87171" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#f87171</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#ef4444")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#ef4444" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#ef4444</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#dc2626")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#dc2626" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#dc2626</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#fb923c")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#fb923c" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#fb923c</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#f97316")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#f97316" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#f97316</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#ea580c")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#ea580c" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#ea580c</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#fbbf24")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#fbbf24" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#fbbf24</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#f59e0b")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#f59e0b" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#f59e0b</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#d97706")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#d97706" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#d97706</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#facc15")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#facc15" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#facc15</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#eab308")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#eab308" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#eab308</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#ca8a04")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#ca8a04" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#ca8a04</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#a3e635")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#a3e635" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#a3e635</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#84cc16")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#84cc16" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#84cc16</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#65a30d")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#65a30d" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#65a30d</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#4ade80")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#4ade80" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#4ade80</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#22c55e")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#22c55e" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#22c55e</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#16a34a")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#16a34a" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#16a34a</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#34d399")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#34d399" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#34d399</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#10b981")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#10b981" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#10b981</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#059669")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#059669" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#059669</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#2dd4bf")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#2dd4bf" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#2dd4bf</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#14b8a6")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#14b8a6" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#14b8a6</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#0d9488")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#0d9488" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#0d9488</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#22d3ee")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#22d3ee" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#22d3ee</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#06b6d4")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#06b6d4" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#06b6d4</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#0891b2")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#0891b2" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#0891b2</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#38bdf8")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#38bdf8" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#38bdf8</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#0ea5e9")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#0ea5e9" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#0ea5e9</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#0284c7")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#0284c7" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#0284c7</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#60a5fa")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#60a5fa" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#60a5fa</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#3b82f6")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#3b82f6" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#3b82f6</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#2563eb")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#2563eb" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#2563eb</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#818cf8")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#818cf8" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#818cf8</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#6366f1")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#6366f1" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#6366f1</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#4f46e5")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#4f46e5" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#4f46e5</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#a78bfa")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#a78bfa" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#a78bfa</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#8b5cf6")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#8b5cf6" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#8b5cf6</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#7c3aed")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#7c3aed" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#7c3aed</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#c084fc")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#c084fc" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#c084fc</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#a855f7")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#a855f7" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#a855f7</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#9333ea")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#9333ea" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#9333ea</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#e879f9")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#e879f9" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#e879f9</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#d946ef")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#d946ef" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#d946ef</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#c026d3")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#c026d3" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#c026d3</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#f472b6")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#f472b6" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#f472b6</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#ec4899")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#ec4899" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#ec4899</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#db2777")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#db2777" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#db2777</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#fb7185")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#fb7185" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#fb7185</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#f43f5e")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#f43f5e" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#f43f5e</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#e11d48")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#e11d48" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#e11d48</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#94a3b8")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#94a3b8" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#94a3b8</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#64748b")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#64748b" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#64748b</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#475569")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#475569" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#475569</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#9ca3af")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#9ca3af" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#9ca3af</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#6b7280")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#6b7280" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#6b7280</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#4b5563")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#4b5563" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#4b5563</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#000000")}
                      className="h-10 rounded-md border-2 border-gray-200 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#000000" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#000000</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleHighlightInsert("#ffffff")}
                      className="h-10 rounded-md border-2 border-gray-900 hover:border-amber-600 transition-colors"
                      style={{ backgroundColor: "#ffffff" }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>#ffffff</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setHighlightDialogOpen(false);
                    setSavedSelection(null);
                    setSelectedText("");
                  }}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogContent
              className="bg-white smooth_transition"
              style={{ backgroundColor: "var(--dark-bg, white)" }}
            >
              <DialogHeader>
                <DialogTitle>Add Image</DialogTitle>
                <DialogDescription>
                  Enter the image URL and an optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="image-url">Image URL *</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.jpg"
                    value={dialogUrl}
                    onChange={(e) => {
                      setDialogUrl(e.target.value);
                      setUrlError("");
                    }}
                  />
                  {urlError && (
                    <p className="text-xs text-red-600">{urlError}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image-description">
                    Description (optional)
                  </Label>
                  <Input
                    id="image-description"
                    placeholder="Image description"
                    value={dialogDescription}
                    onChange={(e) => setDialogDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageDialogOpen(false);
                    setDialogUrl("");
                    setDialogDescription("");
                    setSavedSelection(null);
                    setUrlError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDialogInsert("image")}
                  disabled={!dialogUrl}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Insert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogContent className="bg-white dark:bg-gray-800 smooth_transition">
              <DialogHeader>
                <DialogTitle>Add Link</DialogTitle>
                <DialogDescription>
                  Enter the link URL and an optional link text.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="link-url">URL *</Label>
                  <Input
                    id="link-url"
                    placeholder="https://example.com"
                    value={dialogUrl}
                    onChange={(e) => {
                      setDialogUrl(e.target.value);
                      setUrlError("");
                    }}
                  />
                  {urlError && (
                    <p className="text-xs text-red-600">{urlError}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link-text">Link Text (optional)</Label>
                  <Input
                    id="link-text"
                    placeholder="Click here"
                    value={dialogDescription}
                    onChange={(e) => setDialogDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLinkDialogOpen(false);
                    setDialogUrl("");
                    setDialogDescription("");
                    setSavedSelection(null);
                    setUrlError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDialogInsert("link")}
                  disabled={!dialogUrl}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Insert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={gifDialogOpen} onOpenChange={setGifDialogOpen}>
            <DialogContent className="bg-white dark:bg-gray-800 smooth_transition">
              <DialogHeader>
                <DialogTitle>Add GIF</DialogTitle>
                <DialogDescription>
                  Enter the GIF URL and an optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="gif-url">GIF URL *</Label>
                  <Input
                    id="gif-url"
                    placeholder="https://example.com/animation.gif"
                    value={dialogUrl}
                    onChange={(e) => {
                      setDialogUrl(e.target.value);
                      setUrlError("");
                    }}
                  />
                  {urlError && (
                    <p className="text-xs text-red-600">{urlError}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gif-description">
                    Description (optional)
                  </Label>
                  <Input
                    id="gif-description"
                    placeholder="GIF description"
                    value={dialogDescription}
                    onChange={(e) => setDialogDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGifDialogOpen(false);
                    setDialogUrl("");
                    setDialogDescription("");
                    setSavedSelection(null);
                    setUrlError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDialogInsert("gif")}
                  disabled={!dialogUrl}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Insert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </ProtectedRoute>
  );
}
