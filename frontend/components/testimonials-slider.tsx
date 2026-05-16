"use client";

import { useState, useEffect, useCallback } from "react";

const TESTIMONIALS = [
  {
    name: "Rahul Dabhi",
    initials: "RD",
    tag: "Cardiac Consultation",
    rating: 5,
    review:
      "MediBridge changed how I look at healthcare. I got connected with a top cardiologist within hours. The video call was crystal clear and the doctor was incredibly thorough. Got my digital prescription the same day — no waiting room, no stress.",
    color: "from-teal-500 to-cyan-500",
    accent: "bg-teal-50 border-teal-100",
    dot: "bg-teal-500",
  },
  {
    name: "Sanket Mistry",
    initials: "SM",
    tag: "Orthopedic Surgery Package",
    rating: 5,
    review:
      "I was nervous about getting surgery abroad, but MediBridge handled everything — visa, flights, hotel, and the hospital stay. The personal coordinator kept me informed at every step. The surgery was a complete success and I saved over 60% compared to back home.",
    color: "from-blue-500 to-indigo-500",
    accent: "bg-blue-50 border-blue-100",
    dot: "bg-blue-500",
  },
  {
    name: "Ronak Rohit",
    initials: "RR",
    tag: "Neurology Consultation",
    rating: 5,
    review:
      "Absolutely impressed by the quality of care. The neurologist took time to explain everything in detail and the follow-up was seamless. Having all my medical records in one place on the portal is a game-changer. Highly recommend MediBridge to anyone.",
    color: "from-purple-500 to-violet-500",
    accent: "bg-purple-50 border-purple-100",
    dot: "bg-purple-500",
  },
  {
    name: "Pankaj Patel",
    initials: "PP",
    tag: "Dental Surgery Package",
    rating: 5,
    review:
      "From booking to post-surgery recovery, MediBridge was with me every step. The dental team was world-class and the all-inclusive package meant zero surprises on costs. I've already referred three of my friends. Truly outstanding service!",
    color: "from-emerald-500 to-teal-500",
    accent: "bg-emerald-50 border-emerald-100",
    dot: "bg-emerald-500",
  },
];

export default function TestimonialsSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const go = useCallback((next: number, dir: "left" | "right") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(next);
      setAnimating(false);
    }, 300);
  }, [animating]);

  const prev = () => go((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length, "left");
  const next = useCallback(() => go((current + 1) % TESTIMONIALS.length, "right"), [current, go]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const t = TESTIMONIALS[current];

  const slideClass = animating
    ? direction === "right"
      ? "opacity-0 translate-x-8"
      : "opacity-0 -translate-x-8"
    : "opacity-100 translate-x-0";

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-zinc-50 to-white overflow-hidden">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-100 mb-4">
            Patient Stories
          </span>
          <h2 className="text-3xl font-bold text-zinc-900">
            What our users have to say about MediBridge
          </h2>
          <p className="text-zinc-500 mt-3 text-base max-w-xl mx-auto">
            Real experiences from patients who trusted us with their health journey
          </p>
        </div>

        {/* Slider */}
        <div className="relative flex items-center gap-4">
          {/* Prev arrow */}
          <button
            onClick={prev}
            className="shrink-0 w-11 h-11 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 hover:text-teal-600 hover:border-teal-300 hover:shadow-md transition-all"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Card */}
          <div
            className={`flex-1 bg-white rounded-3xl border border-zinc-200 shadow-md p-8 sm:p-10 transition-all duration-300 ease-out ${slideClass}`}
          >
            {/* Quote icon */}
            <svg className="w-12 h-12 text-zinc-100 mb-6" fill="currentColor" viewBox="0 0 32 32">
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
            </svg>

            {/* Stars */}
            <div className="flex gap-1 mb-5">
              {[...Array(t.rating)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Review */}
            <p className="text-zinc-700 text-lg leading-relaxed font-medium mb-8">
              &ldquo;{t.review}&rdquo;
            </p>

            {/* Patient row */}
            <div className="flex items-center gap-4 pt-6 border-t border-zinc-100">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {t.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900 text-base">{t.name}</p>
                <p className="text-sm text-zinc-400">{t.tag}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${t.accent} text-zinc-600`}>
                Verified Patient
              </span>
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={next}
            className="shrink-0 w-11 h-11 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 hover:text-teal-600 hover:border-teal-300 hover:shadow-md transition-all"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2.5 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? "right" : "left")}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? `w-6 h-2.5 ${TESTIMONIALS[i].dot}`
                  : "w-2.5 h-2.5 bg-zinc-200 hover:bg-zinc-300"
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>

        {/* Bottom trust bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span><strong className="text-zinc-900">4.9 / 5</strong> average rating</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span><strong className="text-zinc-900">50,000+</strong> patients served</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <span><strong className="text-zinc-900">30+</strong> countries reached</span>
          </div>
        </div>
      </div>
    </section>
  );
}
