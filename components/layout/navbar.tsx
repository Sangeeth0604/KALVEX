"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Tools", href: "/tools" },
  { label: "AI Workspace", href: "/ai-workspace", badge: "New" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/90 backdrop-blur-md transition-colors">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Logo size="md" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-accent bg-accent-subtle"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="ml-1.5 text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-border-accent-subtle">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/tools">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Actions & Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border-default bg-surface-raised text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                /* Close Icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                /* Menu Hamburger Icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border-subtle animate-in fade-in duration-150">
            <nav className="flex flex-col gap-1 pb-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-accent bg-accent-subtle"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded-full bg-accent-subtle text-accent border border-border-accent-subtle">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-border-subtle flex flex-col gap-2">
              <Link href="/tools" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
