// controllers/translateController.js
const https = require("https");

// Try to load db - if it fails, cache is disabled
let db = null;
try {
  db = require("../config/db");
} catch (e) {
  console.warn("DB not available - translation cache disabled");
}

const LANG_MAP = {
  ta: "ta",
  hi: "hi",
  en: "en",
};

// ── Call MyMemory API ─────────────────────────────────────
function myMemoryTranslate(text, target) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(text);
    const path = `/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encoded}`;

    const options = {
      hostname: "translate.googleapis.com",
      path,
      method: "GET",
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          // Response is nested arrays: [[["translatedText","original",...],...],...]
          const translated = parsed[0]
            .map((segment) => segment[0])
            .join("");
          resolve(translated || text);
        } catch {
          resolve(text);
        }
      });
    });

    req.on("error", () => resolve(text));
    req.end();
  });
}

// ── Try to get from DB cache ──────────────────────────────
function getCached(text, target) {
  return new Promise((resolve) => {
    if (!db) return resolve(null);
    try {
      db.query(
        "SELECT translated FROM translation_cache WHERE source_text = ? AND target_lang = ?",
        [text, target],
        (err, rows) => {
          if (err) return resolve(null);
          resolve(rows.length > 0 ? rows[0].translated : null);
        }
      );
    } catch {
      resolve(null);
    }
  });
}

// ── Try to store in DB cache ──────────────────────────────
function storeCache(text, target, translated) {
  if (!db) return;
  try {
    db.query(
      `INSERT INTO translation_cache (source_text, target_lang, translated)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE translated = VALUES(translated)`,
      [text, target, translated],
      (err) => {
        if (err) console.warn("Cache store skipped:", err.message);
      }
    );
  } catch {
    // ignore cache errors
  }
}

// ── Main controller ───────────────────────────────────────
exports.translate = async (req, res) => {
  console.log("CONTENT-TYPE:", req.headers["content-type"]);
  console.log("BODY:", req.body);
  const { texts, target } = req.body || {};

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ message: "texts array is required" });
  }
  if (!target) {
    return res.status(400).json({ message: "target language is required" });
  }
  if (target === "en") {
    return res.json({ translations: texts });
  }

  try {
    // Check cache for all texts
    const cacheResults = await Promise.all(
      texts.map((text) => getCached(text, target))
    );

    // Find misses
    const misses = [];
    cacheResults.forEach((cached, i) => {
      if (cached === null) misses.push(i);
    });

    // Translate misses via MyMemory
    if (misses.length > 0) {
      const translated = await Promise.all(
        misses.map((i) => myMemoryTranslate(texts[i], target))
      );
      translated.forEach((result, j) => {
        const i = misses[j];
        cacheResults[i] = result;
        storeCache(texts[i], target, result);
      });
    }

    res.json({ translations: cacheResults });
  } catch (err) {
    console.error("Translation error:", err.message);
    // Always return something — fallback to original texts
    res.json({ translations: texts });
  }
};