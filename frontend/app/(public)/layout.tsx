import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-teal-600 tracking-tight hover:text-teal-700 transition-colors">
            MediBridge
          </Link>
          <nav className="flex items-center gap-7">
            <Link href="/doctors" className="text-sm text-zinc-600 hover:text-teal-600 font-medium transition-colors">Doctors</Link>
            <Link href="/packages" className="text-sm text-zinc-600 hover:text-teal-600 font-medium transition-colors">Surgery Packages</Link>
            <Link href="/auth/login" className="text-sm font-medium text-zinc-600 hover:text-teal-600 transition-colors">Login</Link>
            <Link href="/auth/signup"
              className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
