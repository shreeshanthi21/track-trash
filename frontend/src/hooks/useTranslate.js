// src/hooks/useTranslate.js
// Use this to translate dynamic data coming from your backend API.
//
// Usage:
//   const { translateObj, lang } = useTranslate();
//
//   useEffect(() => {
//     translateObj(bins, ["location", "status"]).then(setTranslatedBins);
//   }, [bins, lang]);

import { useCallback, useState } from "react";
import { useLang } from "../i18n/LangContext";
import { translateTexts } from "../services/translateService";

export function useTranslate() {
  const { lang } = useLang();
  const [loading, setLoading] = useState(false);

  // Translate specific fields in an array of objects
  const translateObj = useCallback(
    async (items, fields) => {
      if (!items || items.length === 0) return items;
      if (lang === "en") return items;

      setLoading(true);
      try {
        // Flatten all field values into one batch
        const allTexts = [];
        items.forEach((item) => {
          fields.forEach((field) => {
            allTexts.push(String(item[field] ?? ""));
          });
        });

        const translated = await translateTexts(allTexts, lang);

        // Map back onto objects
        let idx = 0;
        return items.map((item) => {
          const copy = { ...item };
          fields.forEach((field) => { copy[field] = translated[idx++]; });
          return copy;
        });
      } catch {
        return items;
      } finally {
        setLoading(false);
      }
    },
    [lang]
  );

  return { translateObj, lang, loading };
}