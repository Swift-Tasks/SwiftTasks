import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "foreground";
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center cursor-pointer justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

    const variantStyles = {
      primary:
        "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 dark:text-amber-50 focus-visible:ring-amber-500/50",
      secondary:
        "bg-transparent border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5 focus-visible:ring-gray-400/50",
      outline:
        "border border-gray-300/30 dark:border-neutral-600/30 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-white/5 focus-visible:ring-gray-400/50",
      ghost:
        "bg-transparent text-gray-700 dark:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 focus-visible:ring-gray-400/50",
      foreground:
        "bg-white dark:bg-[oklch(0.228_0.013_286.375)] text-gray-900 dark:text-white  border-gray-200 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-[oklch(0.26_0.013_286.375)] focus-visible:ring-gray-400/50",
    };

    return (
      <button
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
