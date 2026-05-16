import type { Metadata } from "next";
import Link from "next/link";
import TestimonialsSlider from "@/components/testimonials-slider";
import HeroSection from "@/components/hero-section";

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

const STATS = [
  { value: "500+", label: "Verified Doctors" },
  { value: "8", label: "Partner Hospitals" },
  { value: "50+", label: "Surgery Packages" },
  { value: "24/7", label: "Support Available" },
];

const SPECIALTIES = [
  { icon: "🩺", name: "General Physician",      desc: "Fever, cold, flu & common health issues",      color: "bg-blue-50 text-blue-600" },
  { icon: "🫀", name: "Cardiologist",            desc: "Heart conditions & blood pressure",             color: "bg-red-50 text-red-600" },
  { icon: "🦴", name: "Orthopedist",             desc: "Bone, joint & muscle problems",                 color: "bg-orange-50 text-orange-600" },
  { icon: "🧠", name: "Neurologist",             desc: "Brain, spine & nervous system",                 color: "bg-purple-50 text-purple-600" },
  { icon: "🦷", name: "Dentist",                 desc: "Teeth, gums & oral health care",               color: "bg-cyan-50 text-cyan-600" },
  { icon: "👁️", name: "Ophthalmologist",         desc: "Eye conditions, vision & surgery",              color: "bg-indigo-50 text-indigo-600" },
  { icon: "👂", name: "ENT Specialist",           desc: "Ear, nose & throat conditions",                color: "bg-yellow-50 text-yellow-600" },
  { icon: "🌸", name: "Gynaecologist",           desc: "Women's health & reproductive care",            color: "bg-pink-50 text-pink-600" },
  { icon: "🧬", name: "Oncologist",              desc: "Cancer diagnosis, treatment & care",            color: "bg-rose-50 text-rose-600" },
  { icon: "🫁", name: "Pulmonologist",           desc: "Lung, breathing & respiratory care",            color: "bg-sky-50 text-sky-600" },
  { icon: "🧪", name: "Gastroenterologist",      desc: "Digestive system, liver & gut health",          color: "bg-emerald-50 text-emerald-600" },
  { icon: "💉", name: "Urologist",               desc: "Kidney, bladder & urinary tract",               color: "bg-teal-50 text-teal-600" },
  { icon: "👶", name: "Pediatrician",            desc: "Child health & development",                    color: "bg-lime-50 text-lime-600" },
  { icon: "🧘", name: "Psychiatrist",            desc: "Mental health & emotional wellness",            color: "bg-violet-50 text-violet-600" },
  { icon: "💪", name: "Physiotherapist",         desc: "Physical rehab & pain management",              color: "bg-amber-50 text-amber-600" },
  { icon: "🥗", name: "Dietitian / Nutritionist", desc: "Diet plans & nutrition counseling",            color: "bg-green-50 text-green-600" },
];

const STEPS = [
  { n: "1", title: "Create Account",       desc: "Sign up as a patient in under a minute.", icon: "👤" },
  { n: "2", title: "Describe Symptoms",    desc: "Submit your symptoms. Our team matches you with the right specialist.", icon: "📋" },
  { n: "3", title: "Book & Confirm",       desc: "Pick a time slot and confirm. Get a Jitsi video link instantly.", icon: "📅" },
  { n: "4", title: "Consult & Get Rx",     desc: "Video call with your doctor and receive a signed digital prescription.", icon: "💊" },
];

const WHY_US = [
  {
    icon: "✅",
    title: "Verified Medical Professionals",
    desc: "Every doctor is a licensed practitioner registered with the Medical Council of India.",
    color: "bg-teal-50 text-teal-700",
  },
  {
    icon: "⚡",
    title: "Response Within 1 Hour",
    desc: "Get your consultation response or medical certificate faster than any clinic visit.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: "🔒",
    title: "Data Privacy & Security",
    desc: "Bank-grade encryption protects your health records and personal information.",
    color: "bg-purple-50 text-purple-700",
  },
  {
    icon: "💰",
    title: "Affordable Healthcare",
    desc: "World-class Indian medical expertise at a fraction of Western healthcare costs.",
    color: "bg-green-50 text-green-700",
  },
  {
    icon: "🌍",
    title: "Access From Anywhere",
    desc: "Connect with top Indian doctors from Canada, USA, UK — all you need is internet.",
    color: "bg-orange-50 text-orange-700",
  },
  {
    icon: "✈️",
    title: "Full Surgery Support",
    desc: "All-inclusive packages — surgery, flights, hotel, visa support & personal coordinator.",
    color: "bg-rose-50 text-rose-700",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-teal-600 tracking-tight">MediBridge</Link>
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

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-100 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-teal-600">{s.value}</p>
              <p className="text-sm text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Find Doctors by Specialty ───────────────────────────────── */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900">Find Doctors by Specialty</h2>
            <p className="text-zinc-500 mt-3 text-base max-w-xl mx-auto">
              Consult with top doctors across various specialties through video consultation or chat
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SPECIALTIES.map((s) => (
              <Link
                key={s.name}
                href="/auth/signup"
                className="flex items-start gap-4 p-4 rounded-xl bg-white border border-zinc-200 hover:border-teal-400 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${s.color}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 text-sm leading-snug group-hover:text-teal-700 transition-colors">{s.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/doctors"
              className="inline-flex items-center justify-center h-11 px-8 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
            >
              View All Doctors →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900">How It Works</h2>
            <p className="text-zinc-500 mt-3 text-base">Get expert medical care in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-zinc-200 z-0" style={{ width: "calc(100% - 3rem)" }} />
                )}
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{s.title}</p>
                    <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose MediBridge ───────────────────────────────────── */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900">Why Choose MediBridge?</h2>
            <p className="text-zinc-500 mt-3 text-base max-w-xl mx-auto">
              Trusted by patients and healthcare professionals worldwide for reliable medical services
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_US.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-teal-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-zinc-900 text-base mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSlider />

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-600 to-cyan-600">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-teal-100 text-base">Create a free account and book your first consultation in minutes.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-teal-700 text-base font-bold hover:bg-teal-50 transition-colors shadow-lg">
              Create Free Account
            </Link>
            <Link href="/doctors"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border-2 border-white/60 text-white text-base font-semibold hover:bg-white/10 transition-colors">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xl font-bold text-white">MediBridge</p>
              <p className="text-xs text-zinc-500 mt-1">World-class care, accessible to all.</p>
            </div>
            <nav className="flex gap-8 text-sm">
              <Link href="/doctors" className="hover:text-white transition-colors">Doctors</Link>
              <Link href="/packages" className="hover:text-white transition-colors">Packages</Link>
              <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
              <Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} MediBridge. All rights reserved. | Medical consultations are not a substitute for emergency care.
          </div>
        </div>
      </footer>

    </div>
  );
}
