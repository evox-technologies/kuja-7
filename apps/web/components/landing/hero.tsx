"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { asset } from "@/lib/assets";
import { useI18n } from "@/lib/i18n/use-i18n";

export default function Hero() {
  const { t } = useI18n();
  const router = useRouter();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const gender = fd.get("gender") as string;
    const ageMin = fd.get("ageMin") as string;
    const ageMax = fd.get("ageMax") as string;
    if (gender) params.set("gender", gender);
    if (ageMin) params.set("ageMin", ageMin);
    if (ageMax) params.set("ageMax", ageMax);
    router.push(`/dashboard/home?${params.toString()}`);
  }

  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden">
      <Image
        src={asset("/images/hero.webp")}
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
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
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
          {/* <form onSubmit={handleSearch}>
            <div className="bg-white rounded-2xl shadow-2xl px-4 py-4 lg:px-6 lg:py-5 flex flex-col lg:flex-row items-stretch lg:items-end gap-3 lg:gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                  {t("hero.lookingFor")}
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    defaultValue="FEMALE"
                    className="w-full h-10 rounded-full border border-gray-200 bg-white pl-4 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
                  >
                    <option value="FEMALE">{t("hero.bride")}</option>
                    <option value="MALE">{t("hero.groom")}</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ▾
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                  {t("hero.ageRange")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    name="ageMin"
                    type="number"
                    placeholder={t("hero.min")}
                    className="text-center"
                  />
                  <span className="text-gray-300 font-light">—</span>
                  <Input
                    name="ageMax"
                    type="number"
                    placeholder={t("hero.max")}
                    className="text-center"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="rounded-full px-6 shrink-0 w-full lg:w-auto lg:-ml-2"
              >
                {t("hero.searchNow")} <ChevronRight className="w-2 h-4 ml-1" />
              </Button>
            </div>
          </form> */}
          <form onSubmit={handleSearch} className="w-full max-w-6xl mx-auto">
  <div className="bg-white rounded-3xl shadow-2xl px-6 py-6 lg:px-9 lg:py-8 flex flex-col lg:flex-row items-stretch lg:items-end gap-5 lg:gap-6">
    <div className="flex-1">
      <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
        {t("hero.lookingFor")}
      </label>

      <div className="relative">
        <select
          name="gender"
          defaultValue="FEMALE"
          className="w-full h-14 rounded-full border border-gray-200 bg-white pl-6 pr-12 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
        >
          <option value="FEMALE">{t("hero.bride")}</option>
          <option value="MALE">{t("hero.groom")}</option>
        </select>

        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
          ▾
        </div>
      </div>
    </div>

    <div className="flex-1">
      <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
        {t("hero.ageRange")}
      </label>

      <div className="flex items-center gap-3">
        <Input
          name="ageMin"
          type="number"
          placeholder={t("hero.min")}
          className="h-14 rounded-full text-center text-base"
        />

        <span className="text-gray-300 text-xl font-light">—</span>

        <Input
          name="ageMax"
          type="number"
          placeholder={t("hero.max")}
          className="h-14 rounded-full text-center text-base"
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
</form>
        </motion.div>
      </div>
    </section>
  );
}
