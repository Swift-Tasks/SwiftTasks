"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { useSettings } from "@/components/settings-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings-section";
import {
  GraduationCap,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  User,
  X,
  BookOpen,
  Settings,
  Accessibility,
  Type,
  ZoomIn,
  Sparkles,
  Contrast,
  Sun,
  Moon,
  Palette,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getAllCourses,
  getEnabledCourses,
  setEnabledCourses,
} from "@/app/dashboard-will-v/actions";

interface CanvasSettings {
  configured: boolean;
  apiUrl: string | null;
  hasToken: boolean;
  lastSync: string | null;
  canvasBaseUrl: string | null;
  connectionVerified: boolean;
  connectionError: string | null;
}

interface Course {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings | null>(
    null
  );
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Course management state
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enabledCourseIds, setEnabledCourseIds] = useState<string[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isSavingCourses, setIsSavingCourses] = useState(false);

  // General settings state
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const [courses, enabled] = await Promise.all([
        getAllCourses(),
        getEnabledCourses(),
      ]);
      setAllCourses(courses);
      setEnabledCourseIds(enabled);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const fetchCanvasSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/canvas/sync");
      const data = await res.json();
      setCanvasSettings(data);
      // Use user's saved apiUrl, or fall back to environment default
      if (data.apiUrl) {
        setApiUrl(data.apiUrl);
      } else if (data.canvasBaseUrl) {
        setApiUrl(data.canvasBaseUrl);
      }
    } catch (error) {
      console.error("Failed to fetch Canvas settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCanvasSettings();
  }, [fetchCanvasSettings]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update profile");
      }

      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!apiUrl) {
      toast.error("Canvas API URL is required");
      return;
    }

    if (!apiToken) {
      toast.error("Canvas API token is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/canvas/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: apiUrl.trim(),
          apiToken: apiToken.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save settings");
      }

      toast.success(
        "Canvas settings saved! You can now sync your assignments."
      );
      await fetchCanvasSettings();
      setApiToken(""); // Clear the token field after successful save
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Syncing Canvas assignments...");

    try {
      // Sync uses credentials saved in database - no need to pass them
      const response = await fetch("/api/canvas/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Sync failed");
      }

      const data = await response.json();
      toast.success(
        `Synced ${data.synced} assignments, skipped ${data.skipped} existing`,
        { id: toastId }
      );
      await fetchCanvasSettings();
    } catch (error: any) {
      toast.error(error.message || "Failed to sync", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Canvas?")) return;

    try {
      const response = await fetch("/api/canvas/settings", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect Canvas");
      }

      toast.success("Canvas disconnected");
      setApiUrl("");
      setApiToken("");
      await fetchCanvasSettings();
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    }
  };

  // Toggle course enabled/disabled
  const toggleCourse = (courseId: string) => {
    setEnabledCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Save enabled courses
  const handleSaveCourses = async () => {
    setIsSavingCourses(true);
    try {
      await setEnabledCourses(enabledCourseIds);
      toast.success("Course preferences saved!");
    } catch (error) {
      toast.error("Failed to save course preferences");
    } finally {
      setIsSavingCourses(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <button
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Settings
          </h1>

          <div className="space-y-4">
            {/* General Settings Section */}
            <SettingsSection
              title="General Settings"
              description="Configure assignment behavior and preferences"
              icon={Settings}
              iconClassName="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              previewItems={
                [
                  settings.autoCompleteExpired ? "Auto-complete expired" : null,
                  settings.autoCompleteAllTasks
                    ? "Auto-complete when tasks done"
                    : null,
                  !settings.showCompletedAssignments
                    ? "Hiding completed"
                    : null,
                ].filter(Boolean) as string[]
              }
            >
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize how assignments are managed and displayed.
                </p>

                {/* Auto-complete expired assignments */}
                <button
                  onClick={() =>
                    updateSettings({
                      autoCompleteExpired: !settings.autoCompleteExpired,
                    })
                  }
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    settings.autoCompleteExpired
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      settings.autoCompleteExpired
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {settings.autoCompleteExpired && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Auto-complete expired assignments
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically mark assignments as complete when past their
                      due date
                    </p>
                  </div>
                </button>

                {/* Auto-complete when all tasks done */}
                <button
                  onClick={() =>
                    updateSettings({
                      autoCompleteAllTasks: !settings.autoCompleteAllTasks,
                    })
                  }
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    settings.autoCompleteAllTasks
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      settings.autoCompleteAllTasks
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {settings.autoCompleteAllTasks && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Auto-complete when all tasks finished
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically mark assignments as complete when all tasks
                      are done
                    </p>
                  </div>
                </button>

                {/* Show completed assignments */}
                <button
                  onClick={() =>
                    updateSettings({
                      showCompletedAssignments:
                        !settings.showCompletedAssignments,
                    })
                  }
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    settings.showCompletedAssignments
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      settings.showCompletedAssignments
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {settings.showCompletedAssignments && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Show completed assignments
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Display completed assignments on the dashboard
                    </p>
                  </div>
                </button>
              </div>
            </SettingsSection>

            {/* Accessibility Settings Section */}
            <SettingsSection
              title="Accessibility"
              description="Customize the app for your needs"
              icon={Accessibility}
              iconClassName="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
              previewItems={
                [
                  settings.fontFamily !== "default"
                    ? `${
                        settings.fontFamily === "dyslexic"
                          ? "Dyslexia-friendly"
                          : "Monospace"
                      } font`
                    : null,
                  settings.fontSize !== "normal"
                    ? `${
                        settings.fontSize === "large" ? "Large" : "Larger"
                      } text`
                    : null,
                  settings.reducedMotion ? "Reduced motion" : null,
                  settings.highContrast ? "High contrast" : null,
                ].filter(Boolean) as string[]
              }
            >
              <div className="space-y-6">
                {/* Font Family */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-500" />
                    <Label className="text-sm font-medium">Font Family</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: "default",
                        label: "Default",
                        desc: "Standard font",
                      },
                      {
                        value: "dyslexic",
                        label: "Dyslexia",
                        desc: "Easier to read",
                      },
                      {
                        value: "mono",
                        label: "Monospace",
                        desc: "Fixed width",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          updateSettings({ fontFamily: option.value as any })
                        }
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          settings.fontFamily === option.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"
                        }`}
                      >
                        <span
                          className={`block text-sm font-medium ${
                            settings.fontFamily === option.value
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {option.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                    <Label className="text-sm font-medium">Text Size</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "normal", label: "Normal", size: "100%" },
                      { value: "large", label: "Large", size: "112.5%" },
                      { value: "larger", label: "Larger", size: "125%" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          updateSettings({ fontSize: option.value as any })
                        }
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          settings.fontSize === option.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"
                        }`}
                      >
                        <span
                          className={`block text-sm font-medium ${
                            settings.fontSize === option.value
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {option.size}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reduced Motion */}
                <button
                  onClick={() =>
                    updateSettings({ reducedMotion: !settings.reducedMotion })
                  }
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    settings.reducedMotion
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      settings.reducedMotion
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {settings.reducedMotion && <Check className="w-3 h-3" />}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Reduce motion
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Minimize animations and transitions
                    </p>
                  </div>
                </button>

                {/* High Contrast */}
                <button
                  onClick={() =>
                    updateSettings({ highContrast: !settings.highContrast })
                  }
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    settings.highContrast
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      settings.highContrast
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {settings.highContrast && <Check className="w-3 h-3" />}
                  </div>
                  <div className="text-left flex items-center gap-2">
                    <Contrast className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        High contrast mode
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Increase color contrast for better visibility
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Theme & Appearance"
              description="Customize light and dark mode preferences"
              icon={Palette}
              iconClassName="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
              previewItems={[
                settings.autoThemeEnabled
                  ? `Auto: ${settings.lightModeStart} - ${settings.lightModeEnd}`
                  : settings.themeMode === "light"
                  ? "Light mode"
                  : "Dark mode",
              ]}
            >
              <div className="space-y-6">
                {/* Auto Theme Toggle */}
                <button
                  onClick={() =>
                    updateSettings({
                      autoThemeEnabled: !settings.autoThemeEnabled,
                    })
                  }
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    settings.autoThemeEnabled
                      ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      settings.autoThemeEnabled
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {settings.autoThemeEnabled && <Check className="w-3 h-3" />}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Automatic theme switching
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Switch between light and dark mode based on time of day
                    </p>
                  </div>
                </button>

                {/* Time Range for Auto Theme */}
                {settings.autoThemeEnabled && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Light mode active between:</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">Start</Label>
                        <input
                          type="time"
                          value={settings.lightModeStart}
                          onChange={(e) =>
                            updateSettings({ lightModeStart: e.target.value })
                          }
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-input dark:bg-input text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <span className="text-gray-400 mt-5">to</span>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">End</Label>
                        <input
                          type="time"
                          value={settings.lightModeEnd}
                          onChange={(e) =>
                            updateSettings({ lightModeEnd: e.target.value })
                          }
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-input dark:bg-input text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      Dark mode is active outside these hours
                    </p>
                  </div>
                )}

                {/* Manual Theme Selection */}
                {!settings.autoThemeEnabled && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Select Theme</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => updateSettings({ themeMode: "light" })}
                        className={`p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                          settings.themeMode === "light"
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <Sun className="w-6 h-6 text-amber-500" />
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            settings.themeMode === "light"
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          Light
                        </span>
                      </button>
                      <button
                        onClick={() => updateSettings({ themeMode: "dark" })}
                        className={`p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                          settings.themeMode === "dark"
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                          <Moon className="w-6 h-6 text-slate-300" />
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            settings.themeMode === "dark"
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          Dark
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SettingsSection>

            {/* Personal Information Section */}
            <SettingsSection
              title="Personal Information"
              description="Manage your account details"
              icon={User}
              iconClassName="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
              previewItems={["Name", "Email", "Profile picture"]}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50 dark:bg-neutral-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="my-4">
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-neutral-700"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <User className="w-8 h-8 text-amber-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Profile picture is managed by your OAuth provider
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  loading={isSavingProfile}
                  disabled={!name.trim() || name === user?.name}
                  className="w-full"
                >
                  {!isSavingProfile && <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Canvas LMS Integration"
              description="Connect your Canvas account to import assignments"
              icon={GraduationCap}
              previewItems={
                canvasSettings?.configured && canvasSettings?.connectionVerified
                  ? ["Connected", canvasSettings.apiUrl || ""]
                  : canvasSettings?.apiUrl
                  ? ["Not verified", canvasSettings.apiUrl]
                  : ["Not connected"]
              }
              badge={
                canvasSettings?.configured &&
                canvasSettings?.connectionVerified ? (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    Connected
                  </span>
                ) : canvasSettings?.apiUrl ? (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                    Not Verified
                  </span>
                ) : null
              }
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {canvasSettings?.connectionVerified ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">
                            Canvas Connected & Verified
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            {canvasSettings.apiUrl}
                          </p>
                          {canvasSettings.lastSync && (
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                              Last synced:{" "}
                              {new Date(
                                canvasSettings.lastSync
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : canvasSettings?.hasToken ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-300">
                            Connection Failed
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                            {canvasSettings.connectionError ||
                              "Could not verify connection to Canvas. Please check your URL and API token."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-300">
                            Canvas Not Connected
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                            Enter your Canvas API URL and token to sync
                            assignments.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="canvas-api-url">Canvas API URL</Label>
                      <Input
                        id="canvas-api-url"
                        type="url"
                        placeholder="https://canvas.university.edu"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your institution's Canvas URL (without /api/v1)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canvas-api-token">Access Token </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 hover:underline"
                            >
                              How do I get a token?
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="bottom"
                            align="end"
                            className="w-80 bg-card dark:bg-card border border-gray-200 dark:border-neutral-700"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                  Getting your Canvas API Token
                                </p>
                              </div>
                              <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
                                <li>
                                  Go to your Canvas{" "}
                                  <strong>Profile → Settings</strong>
                                </li>
                                <li>
                                  Scroll to{" "}
                                  <strong>Approved Integrations</strong>
                                </li>
                                <li>
                                  Click <strong>+ New Access Token</strong>
                                </li>
                                <li>Enter a purpose (e.g., "SwiftTasks")</li>
                                <li>Leave expiration blank for no expiry</li>
                                <li>
                                  Click <strong>Generate Token</strong>
                                </li>
                                <li>
                                  <strong>Copy the token immediately!</strong>{" "}
                                  It won't be shown again.
                                </li>
                              </ol>
                              <div className="pt-2 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                                {apiUrl && (
                                  <a
                                    href={`${apiUrl.replace(
                                      /\/$/,
                                      ""
                                    )}/profile/settings`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md inline-flex items-center gap-1 transition-colors"
                                  >
                                    Go to Canvas Settings
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <a
                                  href="https://community.canvaslms.com/t5/Student-Guide/How-do-I-manage-API-access-tokens-as-a-student/ta-p/273"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 hover:underline inline-flex items-center gap-1"
                                >
                                  Full guide
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="relative">
                        <Input
                          id="canvas-api-token"
                          type={showToken ? "text" : "password"}
                          placeholder="Enter your Canvas access token"
                          value={apiToken}
                          onChange={(e) => setApiToken(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showToken ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {canvasSettings?.hasToken && (
                        <p className="text-xs text-green-600 dark:text-green-500">
                          ✓ Token saved. Enter a new token only if you want to
                          replace it.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveSettings}
                      loading={isSaving}
                      className="flex-1"
                      disabled={!apiUrl || !apiToken}
                    >
                      {!isSaving && <Save className="w-4 h-4 mr-2" />}
                      Save Settings
                    </Button>

                    {canvasSettings?.hasToken && (
                      <Button
                        onClick={handleSyncNow}
                        loading={isSyncing}
                        variant="ghost"
                      >
                        {!isSyncing && <RefreshCw className="w-4 h-4 mr-2" />}
                        Sync Now
                      </Button>
                    )}
                  </div>

                  {canvasSettings?.hasToken && (
                    <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                      <Button
                        onClick={handleDisconnect}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect Canvas
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </SettingsSection>

            {/* Course Management Section */}
            <SettingsSection
              title="Course Management"
              description="Choose which courses to display on your dashboard"
              icon={BookOpen}
              iconClassName="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
              previewItems={
                enabledCourseIds.length > 0
                  ? [
                      `${enabledCourseIds.length} course${
                        enabledCourseIds.length !== 1 ? "s" : ""
                      } enabled`,
                    ]
                  : ["No courses enabled - dashboard hidden"]
              }
              badge={
                enabledCourseIds.length > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                    {enabledCourseIds.length} active
                  </span>
                ) : null
              }
            >
              {isLoadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : allCourses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No courses found. Sync your Canvas assignments first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable courses to show only their assignments on your
                    dashboard. If no courses are enabled, all assignments will
                    be hidden to prevent unnecessary data from being displayed.
                  </p>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {allCourses.map((course) => {
                      const isEnabled = enabledCourseIds.includes(course.id);
                      return (
                        <button
                          key={course.id}
                          onClick={() => toggleCourse(course.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isEnabled
                              ? "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isEnabled
                                ? "bg-purple-500 border-purple-500 text-white"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {isEnabled && <Check className="w-3 h-3" />}
                          </div>
                          <span
                            className={`text-sm ${
                              isEnabled
                                ? "text-purple-700 dark:text-purple-300 font-medium"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {course.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleSaveCourses}
                    loading={isSavingCourses}
                    className="w-full"
                  >
                    {!isSavingCourses && <Save className="w-4 h-4 mr-2" />}
                    Save Course Preferences
                  </Button>
                </div>
              )}
            </SettingsSection>

            {/* Theme Settings Section */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
