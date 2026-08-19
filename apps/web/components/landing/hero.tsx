"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { asset } from "@/lib/assets";
import { useI18n } from "@/lib/i18n/use-i18n";
import { MIN_AGE, MAX_AGE } from "@/lib/options";

function AgeStepper({
  name,
  value,
  onChange,
  min,
  max,
  label,
}: {
  name: string
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  label: string
}) {
  return (
    <div className="flex h-14 min-w-[8.75rem] flex-1 items-center rounded-full border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-brand-border">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex h-full w-11 shrink-0 items-center justify-center text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input type="hidden" name={name} value={value} />
      <span className="flex-1 text-center text-base tabular-nums text-gray-900" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex h-full w-11 shrink-0 items-center justify-center text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function Hero() {
  const { t } = useI18n();
  const router = useRouter();
  const [ageError, setAgeError] = useState("");
  const [ageMin, setAgeMin] = useState(MIN_AGE);
  const [ageMax, setAgeMax] = useState(MAX_AGE);

  function changeMin(next: number) {
    const clamped = Math.min(MAX_AGE, Math.max(MIN_AGE, next));
    setAgeMin(clamped);
    if (clamped > ageMax) setAgeMax(clamped);
    setAgeError("");
  }

  function changeMax(next: number) {
    const clamped = Math.min(MAX_AGE, Math.max(MIN_AGE, next));
    setAgeMax(clamped);
    if (clamped < ageMin) setAgeMin(clamped);
    setAgeError("");
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const gender = fd.get("gender") as string;

    if (ageMin > ageMax) {
      setAgeError(t("hero.ageOrderError"));
      return;
    }

    setAgeError("");
    if (gender) params.set("gender", gender);
    params.set("ageMin", String(ageMin));
    params.set("ageMax", String(ageMax));
    router.push(`/dashboard/home?${params.toString()}`);
  }

  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden">
      <Image
        src={asset("/images/hero.jpeg")}
        alt="Happy couple"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/25" />

      {/* Carousel dots */}
      <motion.div
        className="absolute bottom-44 left-1/2 -translate-x-1/2 hidden lg:flex gap-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        {[true, false, false].map((active, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${active ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50"}`}
          />
        ))}
      </motion.div>

      {/* Search card */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
        <motion.div
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 28,
            delay: 0.3,
          }}
        >
          <form onSubmit={handleSearch} className="w-full max-w-6xl mx-auto" noValidate>
            <div className="bg-white rounded-3xl shadow-2xl px-6 py-6 lg:px-9 lg:py-8 flex flex-col lg:flex-row items-stretch lg:items-end gap-5 lg:gap-6">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
                  {t("hero.lookingFor")}
                </label>

                <div className="relative">
                  <select
                    name="gender"
                    defaultValue="FEMALE"
                    className="w-full h-14 rounded-full border border-gray-200 bg-white pl-6 pr-12 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-brand-border cursor-pointer"
                  >
                    <option value="FEMALE">{t("hero.bride")}</option>
                    <option value="MALE">{t("hero.groom")}</option>
                  </select>

                  <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    ▾
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-[20rem]">
                <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
                  {t("hero.ageRange")}
                </label>

                <div className="flex items-center gap-3">
                  <AgeStepper
                    name="ageMin"
                    value={ageMin}
                    onChange={changeMin}
                    min={MIN_AGE}
                    max={MAX_AGE}
                    label={t("hero.min")}
                  />

                  <span className="text-gray-300 text-xl font-light shrink-0">—</span>

                  <AgeStepper
                    name="ageMax"
                    value={ageMax}
                    onChange={changeMax}
                    min={MIN_AGE}
                    max={MAX_AGE}
                    label={t("hero.max")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-14 rounded-full px-9 text-base shrink-0 w-full lg:w-auto lg:-ml-2"
              >
                {t("hero.searchNow")}
                <ChevronRight className="w-4 h-5 ml-2" />
              </Button>
            </div>
            {ageError && (
              <p className="mt-2 text-center text-sm font-medium text-red-100 bg-red-500/80 rounded-full px-4 py-1.5">
                {ageError}
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}
