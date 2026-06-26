"use client";

import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/use-i18n";

const LANGS = [
  { value: "si", label: "සිං" },
  { value: "en", label: "Eng" },
];

interface LanguageToggleProps {
  dark?: boolean;
}

export default function LanguageToggle({ dark = false }: LanguageToggleProps) {
  const { locale, setLocale } = useI18n();

  const handleLanguageChange = (value: "en" | "si") => {
    if (locale === value) return;

    setLocale(value);

    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div
      className={`hidden sm:flex items-center rounded-full p-0.5 text-xs ${
        dark ? "bg-white/10" : "bg-gray-100"
      }`}
    >
      {LANGS.map(({ value, label }) => (
        <button
          type="button"
          key={value}
          onClick={() => handleLanguageChange(value as "en" | "si")}
          className="relative px-3 py-1.5 rounded-full font-medium focus:outline-none"
        >
          {locale === value && (
            <motion.span
              layoutId={dark ? "lang-pill-dark" : "lang-pill"}
              className={`absolute inset-0 rounded-full shadow-sm ${
                dark ? "bg-white/20" : "bg-white"
              }`}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}

          <span
            className={`relative z-10 transition-colors duration-150 ${
              dark
                ? locale === value
                  ? "text-white"
                  : "text-white/50 hover:text-white/80"
                : locale === value
                  ? "text-gray-800"
                  : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
