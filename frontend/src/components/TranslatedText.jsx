// src/components/TranslatedText.jsx
import { useState, useEffect } from "react";
import { useLang } from "../i18n/LangContext";
import { translateText } from "../services/translateService";

export default function TX({ children }) {
  const { lang } = useLang();
  const original = String(children ?? "");
  const [output, setOutput] = useState(original);

  useEffect(() => {
    // Reset to original immediately when lang changes
    setOutput(original);

    if (lang === "en" || !original.trim()) {
      return;
    }

    let cancelled = false;

    translateText(original, lang)
      .then((translated) => {
        if (!cancelled) setOutput(translated);
      })
      .catch(() => {
        if (!cancelled) setOutput(original);
      });

    return () => {
      cancelled = true;
    };
  }, [lang, original]); // ← both lang AND original in dependency array

  return output;
}