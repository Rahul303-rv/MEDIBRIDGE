import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MediBridge — Online Medical Consultations & Surgery Packages",
  description:
    "Connect with qualified Indian doctors for same-day consultations and affordable surgery packages with full travel support.",
  openGraph: {
    title: "MediBridge — Online Medical Consultations & Surgery Packages",
    description: "Same-day doctor consultations and bundled surgery packages for international patients.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: "🩺",
    title: "Same-Day Consultations",
    desc: "Video consultations with verified Indian specialists. Appointments available within hours.",
  },
  {
    icon: "✈️",
    title: "Surgery Packages",
    desc: "All-inclusive bundles — surgery, flight, hotel, airport transfer, and visa support.",
  },
  {
    icon: "💊",
    title: "Digital Prescriptions",
    desc: "Receive signed PDF prescriptions with medicine schedules and lab test recommendations.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "Medical records protected with JWT authentication and encrypted connections.",
  },
];

const STEPS = [
  { n: "1", title: "Create Account", desc: "Sign up as a patient in under a minute." },
  { n: "2", title: "Describe Symptoms", desc: "Submit a symptom intake. Our team matches you with the right doctor." },
  { n: "3", title: "Book & Pay", desc: "Pick a time slot and pay securely. Get a Jitsi meeting link instantly." },
  { n: "4", title: "Consult & Receive Rx", desc: "Video call with your doctor. Receive a signed prescription PDF." },
];

export default function HomePage() {
  return (
    <>
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-teal-600">MediBridge</Link>
          <nav className="flex items-center gap-6">
            <Link href="/doctors" className="text-sm text-zinc-600 hover:text-zinc-900">Doctors</Link>
            <Link href="/packages" className="text-sm text-zinc-600 hover:text-zinc-900">Surgery Packages</Link>
            <Link href="/auth/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Login</Link>
            <Link href="/auth/signup"
              className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-50 via-white to-zinc-50 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
            World-class medical care,<br />
            <span className="text-teal-600">without leaving home.</span>
          </h1>
          <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl mx-auto">
            Canadian, American, and British patients connect with verified Indian doctors
            for same-day consultations and affordable surgery packages with full travel support.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-teal-600 text-white text-base font-semibold hover:bg-teal-700 transition-colors shadow-sm">
              Book a Consultation
            </Link>
            <Link href="/packages"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-zinc-200 bg-white text-base font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
              Browse Surgery Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center space-y-3 p-6 rounded-xl border border-zinc-100 hover:border-teal-200 hover:shadow-sm transition-all">
                <p className="text-3xl">{f.icon}</p>
                <p className="font-semibold text-zinc-900">{f.title}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg font-bold">
                  {s.n}
                </div>
                <p className="font-semibold text-zinc-900">{s.title}</p>
                <p className="text-sm text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-teal-600">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="text-teal-100">Create a free account and book your first consultation in minutes.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-teal-700 text-base font-semibold hover:bg-teal-50 transition-colors">
              Create Free Account
            </Link>
            <Link href="/doctors"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-teal-400 text-white text-base font-medium hover:bg-teal-700 transition-colors">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-white">MediBridge</p>
          <nav className="flex gap-6 text-sm">
            <Link href="/doctors" className="hover:text-white transition-colors">Doctors</Link>
            <Link href="/packages" className="hover:text-white transition-colors">Packages</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </nav>
          <p className="text-xs">© {new Date().getFullYear()} MediBridge. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
