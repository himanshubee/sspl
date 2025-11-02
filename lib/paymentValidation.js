const ALLOWED_AMOUNTS = [900, 7900];
const REQUIRED_PAYEE_PATTERN =
  /\b(?:name\s*[:\-]?\s*)?aditya\s+kuveskar\b/i;

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
  const summary = {
    matched: false,
    reasons: [],
    amounts: [],
    matchedAmount: null,
    payeeNameDetected: false,
  };

  if (!rawText) {
    return summary;
  }

  const normalized = normalizeText(rawText);
  const zeroFriendly = replaceAmbiguousCharacters(normalized);
  const sanitized = zeroFriendly.replace(/[,₹]/g, "");
  const payeeNameDetected = REQUIRED_PAYEE_PATTERN.test(normalized);
  summary.payeeNameDetected = payeeNameDetected;

  const amounts = extractCandidateAmounts(zeroFriendly);
  summary.amounts = amounts;

  for (const amount of ALLOWED_AMOUNTS) {
    const reasons = [];
    const secondaryCurrencyPattern = new RegExp(
      String.raw`(?:₹|rs\.?|inr\.?|amount|paid|payment|total)\s*[:=]?\s*${amount}(?:\.00)?\b`,
      "i",
    );
    if (secondaryCurrencyPattern.test(zeroFriendly)) {
      reasons.push("currency_context");
    }

    const secondaryNumericPattern = new RegExp(
      String.raw`\b${amount}(?:\.00)?\b`,
      "i",
    );
    if (secondaryNumericPattern.test(sanitized)) {
      reasons.push("numeric_pattern");
    }

    if (amounts.some((value) => approxEqual(value, amount))) {
      reasons.push("numeric_amount");
    }

    if (spelledOutAmountExists(rawText) && amount === 900) {
      reasons.push("spelled_out");
    }

    if (reasons.length > 0) {
      summary.matchedAmount = amount;
      if (payeeNameDetected) {
        summary.matched = true;
        summary.reasons = [...reasons, "payee_name"];
      } else {
        summary.matched = false;
        summary.reasons = [...reasons, "missing_payee_name"];
      }
      break;
    }
  }

  if (!summary.matched && !payeeNameDetected) {
    if (!summary.reasons.includes("missing_payee_name")) {
      summary.reasons.push("missing_payee_name");
    }
  }

  return summary;
}
