const SUSPICIOUS_TERMS = [
  "gratis",
  "kostenlos",
  "geschenk",
  "gift card",
  "geschenkkarte",
  "western union",
  "paypal freunde",
  "whatsapp",
  "telegram",
  "garantie",
  "billig",
  "original",
  "rechnung",
];

/**
 * Heuristic fraud assessment. This never bans anybody automatically; it only
 * produces a score that can be reviewed by a moderator.
 * @returns {{score:number, reasons:string[]}}
 */
export function computeFraudAssessment({
  price = 0,
  title = "",
  description = "",
  seller = null,
  duplicateCount = 0,
} = {}) {
  let score = 0;
  const reasons = [];

  const add = (points, reason) => {
    score += points;
    reasons.push(reason);
  };

  const numericPrice = Number(price) || 0;
  if (numericPrice <= 1) {
    add(35, "Ungewöhnlich niedriger Preis");
  } else if (numericPrice < 5) {
    add(20, "Sehr niedriger Preis");
  } else if (numericPrice < 15) {
    add(8, "Niedriger Preis");
  }

  const safeTitle = String(title || "");
  const safeDescription = String(description || "");
  const combined = `${safeTitle} ${safeDescription}`.toLowerCase();

  const matchedTerms = SUSPICIOUS_TERMS.filter((term) => combined.includes(term));
  if (matchedTerms.length) {
    add(Math.min(matchedTerms.length * 8, 24), `Verdächtige Begriffe: ${matchedTerms.join(", ")}`);
  }

  if (safeTitle.length > 0 && safeTitle.length < 8) {
    add(8, "Sehr kurzer Titel");
  }

  const letters = safeTitle.replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
  if (letters.length >= 6) {
    const upper = letters.replace(/[^A-ZÄÖÜ]/g, "").length;
    if (upper / letters.length > 0.6) {
      add(10, "Ungewöhnlich viele Großbuchstaben im Titel");
    }
  }

  if (safeDescription.length > 0 && safeDescription.length < 30) {
    add(12, "Sehr kurze Beschreibung");
  }

  const duplicates = Number(duplicateCount) || 0;
  if (duplicates >= 3) {
    add(20, "Mehrfach eingestelltes ähnliches Angebot");
  } else if (duplicates === 2) {
    add(10, "Ähnliches Angebot bereits vorhanden");
  }

  if (seller) {
    if (seller.isSuspended) {
      add(25, "Verkäuferkonto ist gesperrt");
    }
    if (seller.isEmailVerified === false) {
      add(10, "E-Mail-Adresse des Verkäufers nicht bestätigt");
    }
    if (seller.createdAt) {
      const ageHours = (Date.now() - new Date(seller.createdAt).getTime()) / 36e5;
      if (Number.isFinite(ageHours) && ageHours >= 0 && ageHours < 24) {
        add(15, "Sehr junges Verkäuferkonto");
      }
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: finalScore, reasons };
}

/** Numeric risk score between 0 and 100. */
export function computeFraudScore(input) {
  return computeFraudAssessment(input).score;
}

export default { computeFraudScore, computeFraudAssessment };
