import React from "react";

export type BadgeVariant = "default" | "accent" | "outline" | "success" | "warning" | "error";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-raised text-text-secondary border-border-default",
  accent: "bg-accent-subtle text-accent border-border-accent",
  outline: "bg-transparent text-text-secondary border-border-default",
  success: "bg-success-subtle text-success border-border-accent-subtle",
  warning: "bg-warning-subtle text-warning border-border-default",
  error: "bg-error-subtle text-error border-border-default",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs font-medium tracking-tight",
  md: "px-2.5 py-1 text-xs font-medium tracking-normal",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  dotColor,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dotColor || (variant === "accent" || variant === "success" ? "bg-accent" : "bg-current")
          }`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
