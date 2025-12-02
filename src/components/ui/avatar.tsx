import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
};

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
}: AvatarProps) {
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {src ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className={cn(
            "rounded-full object-cover",
            sizeClasses[size],
            className
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-700",
            sizeClasses[size],
            className
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </>
  );
}
