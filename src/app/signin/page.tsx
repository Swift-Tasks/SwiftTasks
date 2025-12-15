"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

type FormData = {
  name: string;
  email: string;
  password: string;
};

const tips = [
  "If you mentally cannot do a task, don't worry, try a different one.",
  "If you are making no progress on a task, then step away and take a few minutes to stop and reset.",
  "If something comes up that prevents you from doing a task, don't worry, deal with that before you do your tasks.",
];

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid email or password");
        return;
      }

      toast.success("Signed in successfully! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftAuth = async () => {
    setIsMicrosoftLoading(true);

    try {
      await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      console.error("Microsoft auth error:", error);
      toast.error("Failed to sign in with Microsoft");
      setIsMicrosoftLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2  p-12 lg:flex justify-between lg:flex-col">
        <div className="mb-12 flex flex-col w-full justify-center items-center">
          <div className="mb-2 flex items-center gap-2">
            <img src="/images/SwiftTaskLogoSmall.png" alt="Swift Task Logo" />
          </div>
          <p className="text-sm font-bold text-amber-700">
            An app by students, for students.
          </p>
        </div>

        <div className="mt-auto mb-8 rounded-md bg-foreground/60 p-8 h-[420px] flex flex-col">
          <div className="mb-6 inline-block rounded-lg bg-amber-400 px-4 py-2 self-start">
            <h3 className="text-lg font-bold text-gray-900">Tips and Tricks</h3>
          </div>

          <ul className="space-y-4 text-sm text-gray-800 overflow-hidden">
            {tips.map((tip, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-amber-600 shrink-0">•</span>
                <p>{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-white dark:bg-card p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Welcome To SwiftTasks
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get started with SwiftTasks and experience a smarter, faster way
              to stay organised. Creating your account takes just moments, so
              you can jump straight into accomplishing more.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                })}
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                {...register("password", {
                  required: "Password is required",
                })}
                error={errors.password?.message}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              Sign In To SwiftTasks
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
              OR
            </span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={handleMicrosoftAuth}
            loading={isMicrosoftLoading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Login to Microsoft
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <a
                href="/signup"
                className="font-semibold text-amber-500 hover:text-amber-600"
              >
                Sign up
              </a>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
            © SwiftTasks 2025
          </p>
        </div>
      </div>
    </div>
  );
}
