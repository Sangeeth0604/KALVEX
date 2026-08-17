import React from "react";
import Link from "next/link";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export function Logo({
  size = "md",
  showWordmark = true,
  className = "",
}: LogoProps) {
  const iconDimensions = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  const textSizes = {
    sm: "text-base tracking-wider",
    md: "text-lg tracking-wider",
    lg: "text-xl tracking-wider",
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group outline-none select-none ${className}`}
      aria-label="KALVEX Home"
    >
      {/* KALVEX Technical Brand Mark */}
      <div className={`relative flex items-center justify-center ${iconDimensions[size]}`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-accent transition-transform duration-200 group-hover:scale-105"
        >
          {/* Outer technical vault frame */}
          <rect
            x="2"
            y="2"
            width="28"
            height="28"
            rx="6"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent"
            fill="currentColor"
            fillOpacity="0.08"
          />
          {/* Inner geometric K & privacy angle lines */}
          <path
            d="M10 8V24M10 16L18 8M12.5 13.5L22 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Top-right security dot */}
          <circle cx="23" cy="9" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {showWordmark && (
        <span className={`font-bold font-sans text-text-primary ${textSizes[size]}`}>
          KALVEX
          <span className="text-accent ml-0.5">.</span>
        </span>
      )}
    </Link>
  );
}
