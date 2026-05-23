import { useState, useEffect } from "react";
import { useLang } from "../i18n/LangContext";
import { translateText } from "../services/translateService";

export default function TX({ children }) {
  const { lang } = useLang();
  const original = String(children ?? "").trim();
  const [output, setOutput] = useState(original);

  // Synchronize state instantly if language is toggled back to English
  if (lang === "en" && output !== original) {
    setOutput(original);
  }

  useEffect(() => {
    if (lang === "en" || !original) {
      setOutput(original);
      return;
    }

    let isMounted = true;

    translateText(original, lang)
      .then((translated) => {
        if (isMounted && translated) {
          setOutput(translated);
        }
      })
      .catch(() => {
        if (isMounted) setOutput(original);
      });

    return () => {
      isMounted = false;
    };
  }, [lang, original]); // Triggers translation accurately whenever language or string shifts

  return <>{output}</>;
}