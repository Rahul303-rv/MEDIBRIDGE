import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — medical branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-teal-800 via-teal-600 to-cyan-500 flex-col justify-between overflow-hidden p-12">

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-white/5 rounded-full" />

        {/* Medical cross pattern */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, r) => (
            [...Array(5)].map((__, c) => (
              <div
                key={`${r}-${c}`}
                className="absolute"
                style={{ top: `${r * 18 + 5}%`, left: `${c * 22 + 3}%` }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                  <rect x="8" y="2" width="4" height="16" rx="1"/>
                  <rect x="2" y="8" width="16" height="4" rx="1"/>
                </svg>
              </div>
            ))
          ))}
        </div>

        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
              </svg>
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">MediBridge</span>
          </div>

          {/* Headline */}
          <div className="mt-16">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Your health journey,<br />reimagined.
            </h1>
            <p className="text-teal-100 mt-4 text-lg leading-relaxed">
              Connect with verified specialists, book surgeries abroad, and manage your entire care journey in one place.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-12 space-y-5">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                ),
                title: "Verified Doctors",
                desc: "Every specialist is credentialed and background-checked",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-.553.894L16 18M15 10L12 9m3 1v8m-3-8l-3 3m0 0l-3-3m3 3V4"/>
                  </svg>
                ),
                title: "Video Consultations",
                desc: "HD video calls with specialists from anywhere in the world",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                ),
                title: "Surgery Packages",
                desc: "All-inclusive care with flights, hotel & transfers bundled",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                ),
                title: "Digital Prescriptions",
                desc: "Instant digital prescriptions after every consultation",
              },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{f.title}</p>
                  <p className="text-teal-100 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust bar */}
        <div className="relative border-t border-white/15 pt-6 flex items-center gap-8">
          {[
            { value: "500+", label: "Verified Doctors" },
            { value: "50K+", label: "Patients Served" },
            { value: "30+", label: "Countries" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-white font-extrabold text-xl">{s.value}</p>
              <p className="text-teal-200 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
                </svg>
              </div>
              <span className="font-extrabold text-zinc-900 dark:text-white text-lg">MediBridge</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            © {new Date().getFullYear()} MediBridge · {" "}
            <a href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</a>
            {" · "}
            <a href="#" className="hover:text-teal-600 transition-colors">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
