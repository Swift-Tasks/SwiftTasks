import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={`flex h-12 w-full rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-[oklch(0.228_0.013_286.375)] px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-neutral-700 dark:disabled:text-gray-400 ${
            error
              ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500"
              : ""
          } ${className}`}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-amber-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
