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
          className={`flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${
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
