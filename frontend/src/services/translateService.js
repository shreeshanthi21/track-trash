// src/services/translateService.js
const memCache = {};

function cacheKey(text, lang) {
  return `${lang}::${text}`;
}

export async function translateTexts(texts, targetLang) {
  if (targetLang === "en" || !texts || texts.length === 0) return texts;

  const results = new Array(texts.length);
  const needed = [];

  texts.forEach((text, i) => {
    const key = cacheKey(text, targetLang);
    if (memCache[key] !== undefined) {
      results[i] = memCache[key];
    } else {
      needed.push({ i, text });
    }
  });

  if (needed.length > 0) {
    const token = localStorage.getItem("token");

    console.log("Calling /api/translate for:", needed.map(n => n.text), "->", targetLang);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texts: needed.map((n) => n.text),
          target: targetLang,
        }),
      });

      const data = await response.json();
      console.log("Translation response:", data);

      data.translations.forEach((translated, j) => {
        const { i, text } = needed[j];
        results[i] = translated;
        memCache[cacheKey(text, targetLang)] = translated;
      });
    } catch (err) {
      console.error("Translation failed:", err);
      needed.forEach(({ i, text }) => {
        results[i] = text;
      });
    }
  }

  return results;
}

export async function translateText(text, targetLang) {
  const results = await translateTexts([text], targetLang);
  return results[0];
}