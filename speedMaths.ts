/** Procedurally-generated mental-math drill questions - no multiple choice,
 * the user types a numeric (or fraction) answer and it's checked against a
 * computed correct value with a type-appropriate tolerance. Pure generation
 * + checking logic only; session/results state lives in each platform's UI. */

export type SpeedMathType =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "fracToPct"
  | "pctToFrac"
  | "simplify"
  | "approx";

export const ALL_SPEED_MATH_TYPES: SpeedMathType[] = [
  "add", "subtract", "multiply", "divide", "fracToPct", "pctToFrac", "simplify", "approx",
];

export const SPEED_MATH_LABELS: Record<SpeedMathType, string> = {
  add: "Addition",
  subtract: "Subtraction",
  multiply: "Multiplication",
  divide: "Division",
  fracToPct: "Fraction → %",
  pctToFrac: "% → Fraction",
  simplify: "Simplification",
  approx: "Approximation",
};

export interface SpeedMathQuestion {
  id: string;
  type: SpeedMathType;
  prompt: string;
  /** The true numeric value the answer is checked against. */
  answer: number;
  /** Absolute tolerance accepted around `answer`. */
  tolerance: number;
  /** Rounded/canonical form to show in post-answer feedback (may differ
   * slightly from the raw `answer`, e.g. truncated-to-2dp percentages). */
  display: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function randDigits(digits: number): number {
  const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randInt(min, max);
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `sm${Date.now()}${idCounter}`;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

// ---------------------------------------------------------------- add/sub

function generateAdd(): SpeedMathQuestion {
  const count = pick([2, 2, 3]);
  const nums = Array.from({ length: count }, () => randDigits(randInt(2, 4)));
  const answer = nums.reduce((a, b) => a + b, 0);
  return { id: nextId(), type: "add", prompt: `${nums.join(" + ")} = ?`, answer, tolerance: 0, display: fmt(answer) };
}

function generateSubtract(): SpeedMathQuestion {
  const digits = randInt(2, 4);
  let a = randDigits(digits);
  let b = randDigits(digits);
  if (b > a) [a, b] = [b, a];
  const answer = a - b;
  return { id: nextId(), type: "subtract", prompt: `${a} - ${b} = ?`, answer, tolerance: 0, display: fmt(answer) };
}

// ------------------------------------------------------------ multiply/divide

function randOperand(digits: number): number {
  // A 1-digit operand of 0 or 1 makes the question trivial - keep it 2-9.
  return digits === 1 ? randInt(2, 9) : randDigits(digits);
}

function generateMultiply(): SpeedMathQuestion {
  const pattern = pick(["2x1", "2x2", "3x1", "3x2"]);
  const [da, db] = pattern === "2x1" ? [2, 1] : pattern === "2x2" ? [2, 2] : pattern === "3x1" ? [3, 1] : [3, 2];
  const a = randOperand(da);
  const b = randOperand(db);
  const answer = a * b;
  return { id: nextId(), type: "multiply", prompt: `${a} × ${b} = ?`, answer, tolerance: 0, display: fmt(answer) };
}

function generateDivide(): SpeedMathQuestion {
  const b = randInt(2, 99);
  const k = randInt(2, 50);
  const a = b * k;
  return { id: nextId(), type: "divide", prompt: `${a} ÷ ${b} = ?`, answer: k, tolerance: 0, display: fmt(k) };
}

// -------------------------------------------------------- fraction <-> %

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

interface FracEntry { num: number; den: number; truePct: number; truncPct: number }

/** Every simplified proper fraction num/den for den 2..20 - the standard
 * bank-exam "fraction to percentage" memorization table. */
export const FRACTION_TABLE: FracEntry[] = (() => {
  const out: FracEntry[] = [];
  for (let den = 2; den <= 20; den++) {
    for (let num = 1; num < den; num++) {
      if (gcd(num, den) !== 1) continue;
      const truePct = (num / den) * 100;
      const truncPct = Math.floor(truePct * 100) / 100;
      out.push({ num, den, truePct, truncPct });
    }
  }
  return out;
})();

function generateFracToPct(): SpeedMathQuestion {
  const f = pick(FRACTION_TABLE);
  return {
    id: nextId(),
    type: "fracToPct",
    prompt: `${f.num}/${f.den} = ?%`,
    answer: f.truePct,
    tolerance: 0.06,
    display: `${f.truncPct.toFixed(2)}%`,
  };
}

function generatePctToFrac(): SpeedMathQuestion {
  const f = pick(FRACTION_TABLE);
  return {
    id: nextId(),
    type: "pctToFrac",
    prompt: `${f.truncPct.toFixed(2)}% = ? (as a fraction)`,
    answer: f.num / f.den,
    tolerance: 0.0015,
    display: `${f.num}/${f.den}`,
  };
}

// ----------------------------------------------------------- simplify/approx

interface Term { value: number; text: string }

function randomTerm(): Term {
  const kind = pick(["plain", "percent", "square", "sqrt", "multiply", "divide", "squareDivide"]);
  switch (kind) {
    case "percent": {
      const pct = pick([5, 10, 12, 15, 20, 25, 40, 50, 60, 75, 80]);
      const factor = 100 / gcd(100, pct);
      const base = factor * randInt(1, 8);
      return { value: (pct * base) / 100, text: `${pct}% of ${base}` };
    }
    case "square": {
      const n = randInt(4, 25);
      return { value: n * n, text: `${n}²` };
    }
    case "sqrt": {
      const n = randInt(4, 20);
      return { value: n, text: `√${n * n}` };
    }
    case "multiply": {
      const a = randInt(2, 30);
      const b = randInt(2, 30);
      return { value: a * b, text: `${a} × ${b}` };
    }
    case "divide": {
      const b = randInt(2, 20);
      const k = randInt(2, 20);
      return { value: k, text: `${b * k} ÷ ${b}` };
    }
    case "squareDivide": {
      const n = randInt(4, 20);
      const sq = n * n;
      const divisors = [2, 3, 4, 5, 6].filter((d) => sq % d === 0);
      const d = divisors.length ? pick(divisors) : 1;
      return { value: sq / d, text: `${n}²${d > 1 ? ` ÷ ${d}` : ""}` };
    }
    default: {
      const v = randDigits(randInt(2, 3));
      return { value: v, text: `${v}` };
    }
  }
}

function generateSimplify(): SpeedMathQuestion {
  const nTerms = pick([2, 3, 3]);
  const terms = Array.from({ length: nTerms }, randomTerm);
  let total = terms[0].value;
  const parts = [terms[0].text];
  for (let i = 1; i < terms.length; i++) {
    const sign = pick<"+" | "-">(["+", "-"]);
    total = sign === "+" ? total + terms[i].value : total - terms[i].value;
    parts.push(`${sign} ${terms[i].text}`);
  }
  const answer = Math.round(total * 100) / 100;
  return { id: nextId(), type: "simplify", prompt: `${parts.join(" ")} = ?`, answer, tolerance: 0.01, display: fmt(answer) };
}

function decimalNear(base: number, spread: number): number {
  const v = base + (Math.random() * 2 - 1) * spread;
  return Math.round(v * 100) / 100;
}

function generateApprox(): SpeedMathQuestion {
  const kind = pick(["multiply", "percent"]);
  if (kind === "multiply") {
    const baseA = pick([20, 30, 40, 50, 60, 80, 100, 200, 300, 400]);
    const baseB = pick([3, 4, 5, 6, 7, 8, 9, 10, 20, 30]);
    const a = decimalNear(baseA, Math.max(2, baseA * 0.04));
    const b = decimalNear(baseB, Math.max(0.5, baseB * 0.04));
    const answer = a * b;
    const tolerance = Math.max(2, Math.abs(answer) * 0.03);
    return { id: nextId(), type: "approx", prompt: `${fmt(a)} × ${fmt(b)} ≈ ?`, answer, tolerance, display: fmt(Math.round(answer)) };
  }
  const pct = decimalNear(pick([10, 15, 20, 25, 30, 40, 50, 60, 75]), 3);
  const base = pick([200, 300, 400, 500, 600, 800, 900, 1200]);
  const answer = (pct / 100) * base;
  const tolerance = Math.max(2, Math.abs(answer) * 0.03);
  return { id: nextId(), type: "approx", prompt: `${fmt(pct)}% of ${base} ≈ ?`, answer, tolerance, display: fmt(Math.round(answer)) };
}

const GENERATORS: Record<SpeedMathType, () => SpeedMathQuestion> = {
  add: generateAdd,
  subtract: generateSubtract,
  multiply: generateMultiply,
  divide: generateDivide,
  fracToPct: generateFracToPct,
  pctToFrac: generatePctToFrac,
  simplify: generateSimplify,
  approx: generateApprox,
};

/** Picks a random enabled type and generates one question for it. */
export function generateSpeedMathQuestion(types: SpeedMathType[]): SpeedMathQuestion {
  const pool = types.length ? types : ALL_SPEED_MATH_TYPES;
  const type = pick(pool);
  return GENERATORS[type]();
}

/** Parses a raw text answer - a plain number, or "a/b" fraction shorthand
 * (used for the %->fraction direction) - into a comparable decimal value. */
export function parseSpeedMathAnswer(raw: string): number | null {
  const s = raw.trim().replace(/%$/, "");
  if (!s) return null;
  if (s.includes("/")) {
    const [n, d] = s.split("/").map((p) => Number(p.trim()));
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
    return n / d;
  }
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

export function checkSpeedMathAnswer(q: SpeedMathQuestion, raw: string): boolean {
  const parsed = parseSpeedMathAnswer(raw);
  if (parsed === null) return false;
  return Math.abs(parsed - q.answer) <= q.tolerance + 1e-9;
}

export type SpeedMathPaceMode = "count" | "timed";

export interface SpeedMathConfig {
  types: SpeedMathType[];
  mode: SpeedMathPaceMode;
  count?: number;
  durationSec?: number;
}

export interface SpeedMathRecord {
  type: SpeedMathType;
  correct: boolean;
  timeMs: number;
}

export interface SpeedMathTypeBreakdown {
  type: SpeedMathType;
  total: number;
  correct: number;
}

export interface SpeedMathSummary {
  total: number;
  correct: number;
  accuracy: number;
  totalTimeMs: number;
  avgTimeMs: number;
  byType: SpeedMathTypeBreakdown[];
}

export function summarizeSpeedMathSession(records: SpeedMathRecord[]): SpeedMathSummary {
  const total = records.length;
  const correct = records.filter((r) => r.correct).length;
  const totalTimeMs = records.reduce((s, r) => s + r.timeMs, 0);
  const byTypeMap = new Map<SpeedMathType, SpeedMathTypeBreakdown>();
  for (const r of records) {
    const cur = byTypeMap.get(r.type) ?? { type: r.type, total: 0, correct: 0 };
    cur.total += 1;
    if (r.correct) cur.correct += 1;
    byTypeMap.set(r.type, cur);
  }
  return {
    total,
    correct,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    totalTimeMs,
    avgTimeMs: total ? Math.round(totalTimeMs / total) : 0,
    byType: Array.from(byTypeMap.values()),
  };
}
