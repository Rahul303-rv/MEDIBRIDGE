"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomeNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-teal-600 tracking-tight">MediBridge</Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            <Link href="/doctors" className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors">Doctors</Link>
            <Link href="/packages" className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors">Surgery Packages</Link>
            <Link href="/auth/login" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Login</Link>
            <ThemeToggle />
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={close} />

          {/* Drawer */}
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white dark:bg-zinc-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-100 dark:border-zinc-800">
              <Link href="/" className="text-xl font-bold text-teal-600" onClick={close}>MediBridge</Link>
              <button
                onClick={close}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              <Link href="/doctors" onClick={close}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Doctors
              </Link>
              <Link href="/packages" onClick={close}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Surgery Packages
              </Link>
            </nav>

            <div className="px-4 pb-6 space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <Link href="/auth/login" onClick={close}
                className="flex items-center justify-center h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Login
              </Link>
              <Link href="/auth/signup" onClick={close}
                className="flex items-center justify-center h-10 w-full rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
