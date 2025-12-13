"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

type FormData = {
  name: string;
  email: string;
  password: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
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
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to create account");
        return;
      }

      toast.success("Account created successfully! Redirecting...");
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
      <div className="hidden w-1/2 p-12 lg:flex justify-between lg:flex-col">
        <div className="mb-12 flex flex-col w-full justify-center items-center">
          <div className="mb-2 flex items-center gap-2">
            <img src="/images/SwiftTaskLogoSmall.png" alt="Swift Task Logo" />
          </div>
          <p className="text-sm font-bold text-amber-700">
            An app by students, for students.
          </p>
        </div>

        <div className="mt-auto mb-8 rounded-md bg-foreground/60 text-black dark:bg-amber-800/20  p-8 space-y-6">
          <div>
            <div className="mb-2 text-yellow-600">⭐⭐⭐⭐⭐</div>
            <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
              &quot;Game-changer for deadlines!&quot;
            </p>
            <p className="text-sm text-gray-700 dark:text-white">
              I used to forget quiz dates all the time, but this app keeps
              everything organised. The reminders are perfectly timed, and the
              timetable view makes planning my week so much easier. Highly
              recommend!
            </p>
          </div>

          <div>
            <div className="mb-2 text-yellow-600">⭐⭐⭐⭐</div>
            <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
              &quot;Super helpful but could use a dark mode.&quot;
            </p>
            <p className="text-sm text-gray-700 dark:text-white">
              Honestly, I rely on this app every day now. My classes are all
              laid out clearly, and adding tasks is quick. I&apos;d give it 5
              stars if it had a dark mode, but still an amazing tool for college
              life.
            </p>
          </div>

          <div>
            <div className="mb-2 text-yellow-600">⭐⭐⭐⭐⭐</div>
            <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
              &quot;Made my semester so much smoother.&quot;
            </p>
            <p className="text-sm text-gray-700 dark:text-white">
              I love how it syncs my tasks and lets me sort by due date. The
              clean design makes it easy to stay on track, even during hectic
              weeks. Definitely one of the best productivity apps for students.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-card dark:bg-card p-8 lg:w-1/2">
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
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name", {
                  required: "Name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
                error={errors.name?.message}
                disabled={isLoading}
              />
            </div>

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
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  validate: (value) => {
                    return (
                      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value) ||
                      "Password must contain uppercase, lowercase, and number"
                    );
                  },
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
              Signup To SwiftTasks
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
            By signing up you agree to a{" "}
            <a href="#" className="text-amber-500 hover:text-amber-600">
              privacy policy
            </a>{" "}
            and{" "}
            <a href="#" className="text-amber-500 hover:text-amber-600">
              terms of service
            </a>
            .
          </p>

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
            <Link
              href="/signin"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Already have an account?{" "}
              <span className="font-semibold text-amber-500 hover:text-amber-600">
                Sign in
              </span>
            </Link>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
            © SwiftTasks 2025
          </p>
        </div>
      </div>
    </div>
  );
}
