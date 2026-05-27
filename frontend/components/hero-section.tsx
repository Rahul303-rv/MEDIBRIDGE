"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-14px) rotate(0.5deg); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes float-c {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50%       { transform: translateY(-18px) rotate(0.5deg); }
        }
        @keyframes card3d {
          0%, 100% { transform: perspective(1000px) rotateY(-10deg) rotateX(5deg) translateY(0px); }
          50%       { transform: perspective(1000px) rotateY(-8deg)  rotateX(3deg) translateY(-8px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ecg-draw {
          from { stroke-dashoffset: 800; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes ecg-loop {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -800; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-float   { animation: float   4s ease-in-out infinite; }
        .animate-float-b { animation: float-b 5s ease-in-out infinite 0.8s; }
        .animate-float-c { animation: float-c 6s ease-in-out infinite 1.5s; }
        .animate-card3d  { animation: card3d  6s ease-in-out infinite; }
        .ecg-path {
          stroke-dasharray: 800;
          animation: ecg-loop 4s linear infinite;
        }
        .fade-up-1 { animation: fade-up 0.7s ease both 0.1s; }
        .fade-up-2 { animation: fade-up 0.7s ease both 0.25s; }
        .fade-up-3 { animation: fade-up 0.7s ease both 0.4s; }
        .fade-up-4 { animation: fade-up 0.7s ease both 0.55s; }
      `}</style>

      <section className="relative bg-gradient-to-br from-teal-800 via-teal-600 to-cyan-500 overflow-hidden min-h-[680px] flex items-center">

        {/* ── Background depth layers ── */}
        {/* Blurred orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Medical cross watermark */}
        <svg className="absolute right-[38%] top-8 opacity-[0.04] pointer-events-none" width="320" height="320" viewBox="0 0 100 100" fill="white">
          <rect x="38" y="10" width="24" height="80" rx="4" />
          <rect x="10" y="38" width="80" height="24" rx="4" />
        </svg>

        {/* ECG line */}
        <svg className="absolute bottom-0 left-0 w-full pointer-events-none opacity-20" height="80" viewBox="0 0 1200 80" preserveAspectRatio="none">
          <path
            className="ecg-path"
            d="M0,40 L120,40 L150,40 L170,5 L185,75 L200,40 L230,40 L360,40 L390,40 L410,5 L425,75 L440,40 L470,40 L600,40 L630,40 L650,5 L665,75 L680,40 L710,40 L840,40 L870,40 L890,5 L905,75 L920,40 L950,40 L1200,40"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* ── Main content ── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-24 lg:py-20 w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-8">

          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left space-y-5 sm:space-y-7 max-w-xl">
            <div className="fade-up-1 inline-flex items-center gap-2 bg-white/15 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Trusted by patients from 30+ countries
            </div>

            <h1 className="fade-up-2 text-3xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight">
              World-Class<br />Medical Care,<br />
              <span className="text-cyan-200">Without Leaving Home</span>
            </h1>

            <p className="fade-up-3 text-base sm:text-lg text-teal-100 leading-relaxed">
              Connect with verified Indian specialists for same-day video consultations
              and affordable all-inclusive surgery packages with full travel support.
            </p>

            <div className="fade-up-4 flex gap-4 justify-center lg:justify-start flex-wrap">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 h-13 px-7 py-3.5 rounded-xl bg-white text-teal-700 text-base font-bold hover:bg-teal-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Book a Consultation
              </Link>
              <Link
                href="/packages"
                className="inline-flex items-center gap-2 h-13 px-7 py-3.5 rounded-xl border-2 border-white/50 text-white text-base font-semibold hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Browse Packages
              </Link>
            </div>

            {/* Mini stats */}
            <div className="fade-up-4 flex flex-wrap gap-3 sm:gap-5 justify-center lg:justify-start pt-2">
              {[
                { v: "500+", l: "Verified Doctors" },
                { v: "50K+", l: "Patients" },
                { v: "24/7", l: "Support" },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-2">
                  <div className="w-1 h-8 rounded-full bg-white/30" />
                  <div>
                    <p className="text-white font-extrabold text-base leading-none">{s.v}</p>
                    <p className="text-teal-200 text-xs mt-0.5">{s.l}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D floating medical cards */}
          <div className="flex-1 relative hidden lg:flex items-center justify-center h-[480px]">

            {/* ── Main appointment card (3D tilt) ── */}
            <div
              className="animate-card3d absolute w-[320px] bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.35)] overflow-hidden"
              style={{ top: "50%", left: "50%", transform: "translateX(-50%) translateY(-50%) perspective(1000px) rotateY(-10deg) rotateX(5deg)" }}
            >
              {/* Card top accent */}
              <div className="h-1.5 bg-gradient-to-r from-teal-500 to-cyan-400" />
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Upcoming</p>
                    <p className="text-sm font-bold text-zinc-900 mt-0.5">Video Consultation</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animation: "pulse-ring 1.2s cubic-bezier(0.215,0.61,0.355,1) infinite" }} />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">Live</span>
                  </div>
                </div>

                {/* Doctor */}
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    PS
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 text-sm">Dr. Priya Sharma</p>
                    <p className="text-xs text-zinc-400">Cardiologist · MBBS, MD</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      <span className="text-xs font-semibold text-zinc-600">4.9</span>
                      <span className="text-xs text-zinc-400">· 230 reviews</span>
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Scheduled</p>
                    <p className="text-sm font-bold text-zinc-900">Today · 3:00 PM</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-zinc-400">Duration</p>
                    <p className="text-sm font-bold text-zinc-900">30 min</p>
                  </div>
                </div>

                {/* Vitals mini */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: "❤️", label: "72 bpm", sub: "Heart Rate" },
                    { icon: "🩸", label: "120/80", sub: "BP" },
                    { icon: "🌡️", label: "98.4°F", sub: "Temp" },
                  ].map((v) => (
                    <div key={v.sub} className="bg-zinc-50 rounded-xl p-2 text-center">
                      <p className="text-base">{v.icon}</p>
                      <p className="text-xs font-bold text-zinc-800 mt-0.5">{v.label}</p>
                      <p className="text-[10px] text-zinc-400">{v.sub}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className="w-full h-10 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Join Video Call
                </button>
              </div>
            </div>

            {/* ── Floating card: Rating ── */}
            <div
              className="animate-float absolute bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3 shadow-xl"
              style={{ top: "4%", right: "2%" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </div>
                <div>
                  <p className="text-white font-extrabold text-base leading-none">4.9 / 5</p>
                  <p className="text-white/70 text-xs mt-0.5">Patient Rating</p>
                </div>
              </div>
            </div>

            {/* ── Floating card: Prescription ── */}
            <div
              className="animate-float-b absolute bg-white rounded-2xl shadow-2xl px-4 py-3 w-[210px]"
              style={{ bottom: "8%", left: "0%" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-zinc-800">Digital Prescription</p>
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">Amoxicillin 500mg · 5 days<br/>Issued 2 minutes ago</p>
              <div className="mt-2 h-1 rounded-full bg-emerald-100">
                <div className="h-1 rounded-full bg-emerald-500 w-3/4" />
              </div>
            </div>

            {/* ── Floating card: Active patients ── */}
            <div
              className="animate-float-c absolute bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3 shadow-xl"
              style={{ top: "22%", right: "-2%" }}
            >
              <p className="text-white/70 text-xs font-medium">Online Now</p>
              <p className="text-white font-extrabold text-xl leading-none mt-0.5">247</p>
              <div className="flex -space-x-2 mt-2">
                {["from-teal-400 to-cyan-400", "from-blue-400 to-indigo-400", "from-purple-400 to-violet-400", "from-emerald-400 to-teal-400"].map((g, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full bg-gradient-to-br ${g} border-2 border-white/30 shrink-0`} />
                ))}
                <div className="w-6 h-6 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">+</span>
                </div>
              </div>
              <p className="text-white/60 text-[10px] mt-1.5">Patients in session</p>
            </div>

            {/* ── Floating badge: Verified ── */}
            <div
              className="animate-float absolute bg-white rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2"
              style={{ bottom: "28%", right: "1%" }}
            >
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">500+ Doctors</p>
                <p className="text-[10px] text-zinc-400">All Verified ✓</p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
