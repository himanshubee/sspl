const REQUIRED_AMOUNT = 900;
const SECONDARY_AMOUNTS = [7900];

function normalizeText(text) {
  if (!text) return "";
  return text.toLowerCase();
}

function replaceAmbiguousCharacters(text) {
  return text.replace(/o/g, "0").replace(/\$/g, "s");
}

function extractCandidateAmounts(text) {
  const amounts = [];
  const currencyRegex =
    /(?:₹|rs\.?|inr\.?|amount|paid|payment|total)\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)/gi;

  let match;
  while ((match = currencyRegex.exec(text)) !== null) {
    const raw = match[1].replace(/,/g, "");
    const value = Number.parseFloat(raw);
    if (!Number.isNaN(value)) {
      amounts.push(value);
    }
  }

  const plainNumberRegex = /\b([0-9]{2,6})(?:[.,][0-9]{2})?\b/g;
  while ((match = plainNumberRegex.exec(text)) !== null) {
    const raw = match[1].replace(/,/g, "");
    const value = Number.parseFloat(raw);
    if (!Number.isNaN(value)) {
      amounts.push(value);
    }
  }

  return amounts;
}

function approxEqual(value, target) {
  return Math.abs(value - target) <= 0.01;
}

function spelledOutAmountExists(text) {
  const spelledRegex =
    /\bnine\s*(?:hund(?:red)?)\b(?:\s*(?:and)?\s*(?:00|zero|0))?/i;
  return spelledRegex.test(text);
}

export function paymentLooksValid(rawText) {
  return buildPaymentValidationSummary(rawText).matched;
}

export function buildPaymentValidationSummary(rawText) {
  const requiredReasons = new Set();
  const secondaryReasons = new Set();
  const detectedSecondary = new Set();

  const summary = {
    matched: false,
    reasons: [],
    amounts: [],
    secondaryAmounts: [],
  };

  if (!rawText) {
    return summary;
  }

  const normalized = normalizeText(rawText);
  const zeroFriendly = replaceAmbiguousCharacters(normalized);
  const sanitized = zeroFriendly.replace(/[,₹]/g, "");

  if (spelledOutAmountExists(rawText)) {
    requiredReasons.add("required_spelled_out");
  }

  const amounts = extractCandidateAmounts(zeroFriendly);
  summary.amounts = amounts;

  const requiredCurrencyPattern = new RegExp(
    String.raw`(?:₹|rs\.?|inr\.?|amount|paid|payment|total)\s*[:=]?\s*${REQUIRED_AMOUNT}(?:\.00)?\b`,
    "i",
  );
  if (requiredCurrencyPattern.test(zeroFriendly)) {
    requiredReasons.add(`required_currency_match_${REQUIRED_AMOUNT}`);
  }

  const requiredNumericPattern = new RegExp(
    String.raw`\b${REQUIRED_AMOUNT}(?:\.00)?\b`,
    "i",
  );
  if (requiredNumericPattern.test(sanitized)) {
    requiredReasons.add(`required_numeric_pattern_${REQUIRED_AMOUNT}`);
  }

  if (amounts.some((value) => approxEqual(value, REQUIRED_AMOUNT))) {
    requiredReasons.add("required_numeric_amount_match");
  }

  for (const amount of SECONDARY_AMOUNTS) {
    const secondaryCurrencyPattern = new RegExp(
      String.raw`(?:₹|rs\.?|inr\.?|amount|paid|payment|total)\s*[:=]?\s*${amount}(?:\.00)?\b`,
      "i",
    );
    if (secondaryCurrencyPattern.test(zeroFriendly)) {
      secondaryReasons.add(`secondary_currency_match_${amount}`);
      detectedSecondary.add(amount);
    }

    const secondaryNumericPattern = new RegExp(
      String.raw`\b${amount}(?:\.00)?\b`,
      "i",
    );
    if (secondaryNumericPattern.test(sanitized)) {
      secondaryReasons.add(`secondary_numeric_pattern_${amount}`);
      detectedSecondary.add(amount);
    }

    if (amounts.some((value) => approxEqual(value, amount))) {
      secondaryReasons.add(`secondary_numeric_amount_match_${amount}`);
      detectedSecondary.add(amount);
    }
  }

  summary.secondaryAmounts = Array.from(detectedSecondary).sort((a, b) => a - b);
  summary.reasons = [
    ...Array.from(requiredReasons),
    ...Array.from(secondaryReasons),
  ];
  summary.matched = requiredReasons.size > 0;
  return summary;
}
