// src/components/LanguageSwitcher.jsx
import { useLang } from "../i18n/LangContext";
import "./LanguageSwitcher.css";

const LANGS = [
  { code: "en", label: "EN"    },
  { code: "ta", label: "தமிழ்" },
  { code: "hi", label: "हिंदी" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="lang-switcher">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          className={`lang-btn ${lang === code ? "active" : ""}`}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}