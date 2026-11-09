"use client";

import { useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { localeAtom } from "@/store/atoms";
import en from "./locales/en.json";
import cs from "./locales/cs.json";

const dictionaries = { en, cs };

export const locales = [
  { code: "en", label: "English" },
  { code: "cs", label: "Čeština" },
];

function resolve(dictionary, key) {
  const value = key
    .split(".")
    .reduce(
      (acc, part) => (typeof acc === "object" && acc !== null ? acc[part] : undefined),
      dictionary
    );
  return value !== undefined ? value : key;
}

export function useTranslation() {
  const [locale, setLocale] = useAtom(localeAtom);

  const t = useCallback(
    (key) => resolve(dictionaries[locale], key),
    [locale]
  );

  return useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);
}
