/** Study Vault: formulas, "key concept" approach notes, and worked examples
 * for the real RRB PO Arithmetic/STD/Mensuration sub-chapters, plus the
 * square/cube-root shortcuts (shared with Speed Maths's reference data).
 * Pure content + the shortcut math - platform UI (web/mobile) renders it. */

export type ChapterGroup = "A" | "B" | "C" | "D";

export interface FormulaEntry {
  n: string;
  /** May contain "<br>" as a line-break marker - platforms render it as a
   * real line break however fits their UI (dangerouslySetInnerHTML on web,
   * a split-and-map on native). */
  eq: string;
  note?: string;
}

export interface ExampleEntry {
  label: string;
  /** Each line may contain a "{{step:...}}" / "{{b:...}}" inline marker for
   * emphasis - see parseInlineMarkup(). */
  lines: string[];
}

export interface ConceptEntry {
  title: string;
  body: string;
}

/** A named slice of a chapter's theory - e.g. Time & Work's "Combined Work"
 * vs "People Joining/Leaving Mid-Task". Lets a chapter be studied (and later
 * practised) one sub-concept at a time instead of as one undifferentiated
 * blob. `formula` supports the same literal `<br>` line-break convention as
 * FormulaEntry.eq; `body` supports the same {{step:}}/{{b:}} inline markup. */
export interface SubConceptNote {
  name: string;
  body: string;
  formula?: string;
}

export interface ChapterEntry {
  group: ChapterGroup;
  label: string;
  isSpeedMaths?: boolean;
  intro?: string;
  concept?: ConceptEntry;
  formulas?: FormulaEntry[];
  example?: ExampleEntry;
  /** Finer-grained theory breakdown, matching the sub-concept tags used to
   * filter practice sessions in Master Vault for this chapter (where
   * present). Optional - most chapters still just use concept/formulas. */
  subConcepts?: SubConceptNote[];
}

/** Inline emphasis markup used in formula/example strings, platform-neutral
 * (no HTML) so native can render it without a WebView. `{{step:text}}` is
 * the accent color, `{{b:text}}` is bold/white. */
export function parseInlineMarkup(s: string): { text: string; kind: "plain" | "step" | "b" }[] {
  const out: { text: string; kind: "plain" | "step" | "b" }[] = [];
  const re = /\{\{(step|b):(.*?)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), kind: "plain" });
    out.push({ text: m[2], kind: m[1] as "step" | "b" });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), kind: "plain" });
  return out;
}

export const CHAPTER_ORDER = [
  "speedmaths", "ratio", "percentage", "profitloss", "timework", "pipes", "sici", "average", "partnership", "mixture",
  "std", "trains", "boats", "mensuration2d", "mensuration3d",
] as const;
export type ChapterKey = (typeof CHAPTER_ORDER)[number];

export const CHAPTERS: Record<ChapterKey, ChapterEntry> = {
  speedmaths: { group: "A", label: "Speed Maths", isSpeedMaths: true },

  ratio: {
    group: "B", label: "Ratio & Proportion",
    intro: "A ratio compares two quantities of the same kind; a proportion says two ratios are equal.",
    concept: { title: "Scale before you combine", body: "Most ratio mistakes come from combining two ratios that share a term with different values (e.g. b=3 in one, b=4 in another) without scaling first. Always make the shared term equal before writing a:b:c." },
    formulas: [
      { n: "Basic ratio", eq: "a : b = a/b", note: "Always simplify to lowest terms." },
      { n: "Proportion (cross-multiply)", eq: "a:b :: c:d  ⇒  a×d = b×c", note: "The product of extremes = product of means." },
      { n: "Combining two ratios", eq: "a:b=p:q, b:c=q:r ⇒ a:b:c = p:q:r", note: "If the shared term (b) isn't already equal in both, scale each ratio so it matches first." },
      { n: "Duplicate / sub-duplicate", eq: "Duplicate: a²:b²<br>Sub-duplicate: √a : √b", note: "Triplicate ratio is a³:b³." },
      { n: "Componendo-dividendo", eq: "x:y = a:b  ⇒  (x+y):(x−y) = (a+b):(a−b)", note: "Useful when a question gives you a sum/difference condition directly." },
    ],
    example: { label: "Worked example", lines: [
      "a:b = 2:3 and b:c = 4:5 — find a:b:c",
      "{{step:b is 3 in the first, 4 in the second}} → scale to LCM(3,4)=12",
      "a:b = 2:3 → ×4 → {{b:8:12}}",
      "b:c = 4:5 → ×3 → {{b:12:15}}",
      "→ a:b:c = {{b:8 : 12 : 15}}",
    ]},
  },

  percentage: {
    group: "B", label: "Percentage",
    intro: '"Per cent" = per hundred. Almost every arithmetic chapter (profit/loss, SI/CI, DI) is percentage underneath.',
    concept: { title: "Use fraction equivalents, not long division", body: 'Converting a percentage to its fraction form is almost always faster than computing it directly: 50%=1/2, 33.33%=1/3, 25%=1/4, 20%=1/5, 16.67%=1/6, 12.5%=1/8, 11.11%=1/9 — see the Fraction ↔ % reference in Speed Maths for the full set. "20% of 85" as 85/5 is faster than 0.2×85.' },
    formulas: [
      { n: "x% of y", eq: "x% of y = (x × y) / 100" },
      { n: "% change", eq: "% change = (change / original value) × 100" },
      { n: "Successive % changes", eq: "Net% = a + b + (a×b)/100", note: "Use negative values for a decrease. This is the single most tested percentage pattern." },
      { n: "Increase then equal decrease", eq: "Net change = −(x² / 100) %", note: "A number that goes up x% then down x% is always NET NEGATIVE — a very common trap option." },
      { n: "A is x% more than B", eq: "then B is [x / (100+x)] × 100 % less than A", note: "The reverse direction is NOT the same percentage — classic trap." },
    ],
    example: { label: "Worked example", lines: [
      "Price rises 20%, then falls 20% — net change?",
      "{{step:Net% = 20 − 20 + (20×−20)/100}}",
      "= 0 − 4 = {{b:−4%}} (a net loss, not back to original)",
    ]},
  },

  profitloss: {
    group: "B", label: "Profit & Loss",
    intro: "CP = cost price, SP = selling price, MP = marked price (before discount).",
    concept: { title: "Assume CP = 100", body: "When a question gives you percentages but no actual price, just set CP=100. Every profit/loss/discount instantly becomes that many rupees, and multi-step chains (marked up, then discounted, then resold) stay simple whole numbers instead of fractions of an unknown." },
    formulas: [
      { n: "Profit / Loss", eq: "Profit = SP − CP<br>Loss = CP − SP" },
      { n: "Profit% / Loss%", eq: "Profit% = (Profit/CP)×100<br>Loss% = (Loss/CP)×100", note: "Always over CP, never over SP." },
      { n: "Finding SP from %", eq: "SP = CP × (100 ± Profit%or Loss%) / 100" },
      { n: "Discount", eq: "SP = MP × (100 − Discount%) / 100" },
      { n: "Successive discounts", eq: "Net discount% = d₁ + d₂ − (d₁×d₂)/100", note: "Same shape as successive percentage change — two 10% discounts are NOT a 20% discount." },
    ],
    example: { label: "Worked example", lines: [
      "MP=1000, successive discounts of 10% and 20% — final SP?",
      "{{step:Net discount = 10+20−(10×20)/100 = 28%}}",
      "SP = 1000 × (100−28)/100 = {{b:720}}",
    ]},
  },

  timework: {
    group: "B", label: "Time & Work",
    intro: "Think in terms of \"work done per day\" (a rate), not total days — rates add, days don't.",
    concept: { title: "The LCM method (skip fractions entirely)", body: "Instead of working with 1/12, 1/18 etc., set TOTAL WORK = LCM of all the given days. Each person's daily efficiency becomes a whole number (total work ÷ their days), and you just add efficiencies — no fraction arithmetic anywhere." },
    formulas: [
      { n: "1-day work", eq: "A finishes in a days ⇒ A does 1/a of the work per day" },
      { n: "Combined work", eq: "(A+B) per day = 1/a + 1/b<br>Together they finish in ab/(a+b) days" },
      { n: "Three workers", eq: "(A+B+C) per day = 1/a + 1/b + 1/c" },
      { n: "Wages split (same time)", eq: "Wages ratio = ratio of work done" },
      { n: "Men-Days-Hours", eq: "M₁D₁H₁/W₁ = M₂D₂H₂/W₂", note: "The go-to formula whenever a question changes the number of workers, days, AND hours at once." },
    ],
    example: { label: "Worked example — LCM method", lines: [
      "A finishes in 12 days, B in 18 days — together?",
      "{{step:Total work = LCM(12,18) = 36 units}}",
      "A's efficiency = 36/12 = {{b:3/day}}, B's = 36/18 = {{b:2/day}}",
      "Together = 5 units/day → Time = 36/5 = {{b:7.2 days}}",
    ]},
    subConcepts: [
      {
        name: "Efficiency-Based Problems",
        body: "Efficiency is work done per unit time: if a job takes T days, efficiency = 1/T (taking total work = 1 unit). Since total work is fixed, time and efficiency are inversely proportional — whoever takes longer is less efficient.",
        formula: "E × T = constant ⇒ T₁/T₂ = E₂/E₁<br>Quick ratio method: take the reciprocal of a time ratio, then clear fractions by multiplying through by their LCM — e.g. 20:30:60 → 1/20:1/30:1/60 → (×60) → 3:2:1",
      },
      {
        name: "Combined Work Problems",
        body: "Assume total work = LCM of the individual times so every efficiency comes out as a whole number — no fractions anywhere. Together-time = total work ÷ sum of efficiencies.",
        formula: "Two workers (a, b days alone) together: ab/(a+b) days<br>Special case — both take x days alone: together = x/2. Three equal x-day workers: together = x/3.",
      },
      {
        name: "People Joining/Leaving Problems",
        body: "When workers join or leave partway through, split the timeline into segments, each with a fixed set of active workers. The sum of (efficiency × duration) across all segments must equal the total work.",
        formula: "Σ (active efficiency × segment duration) = Total Work<br>\"Leaves n days before completion (time T)\" ⇒ that worker's contribution = efficiency × (T − n) — write this into the total-work equation and solve for T directly.",
      },
      {
        name: "Alternate-Days Work Problems",
        body: "When people work on alternate days, group the timeline into cycles (2-day cycles for two alternating workers, 3-day for three rotating) and find the work done per full cycle. Divide total work by work-per-cycle to get the number of complete cycles, then handle the leftover day separately with whoever's turn it is.",
        formula: "Who starts on Day 1 decides whose turn the leftover day falls on — and can change the final answer, so always track it carefully.",
      },
      {
        name: "Work and Wages Distribution Problems",
        body: "Wages are proportional to work done = efficiency × time worked. If everyone works the same duration, wage ratio = efficiency ratio. If equally-efficient people work different durations, wage ratio = time ratio.",
        formula: "General case: Wage ratio A:B:C = (E_A×T_A) : (E_B×T_B) : (E_C×T_C)<br>Reverse-wage problems: when two scenarios share a common pair of workers, that pair's wage ratio stays fixed across both scenarios — use it to transfer a known wage from one scenario to find an unknown in the other.",
      },
      {
        name: "Men, Women and Children Efficiency Problems",
        body: "When a problem states that some number of men/women/children complete the same job in given times, equate the total work in each case to get an efficiency ratio (e.g. one man's efficiency vs one woman's). Chain multiple such statements to build a combined M:W:C ratio, then use it to solve any mixed-group combination.",
        formula: "n₁ × M × d₁ = n₂ × W × d₂  (same total work in both statements)",
      },
      {
        name: "Men-Days-Hours and Workforce-Change Problems",
        body: "The go-to formula whenever a question changes the number of workers, the number of days, AND the hours per day all at once (or asks a food/ration question in the same shape).",
        formula: "M₁D₁H₁/W₁ = M₂D₂H₂/W₂<br>Drop the H terms if hours aren't mentioned. For ration/food-supply problems: M = number of people, W = amount of food.",
      },
      {
        name: "Algebraic and Quadratic Time-Equation Problems",
        body: "\"A takes k more days than B; together they take d days.\" Let B's alone time = x, so A's = x+k, then solve the resulting quadratic for x and reject the negative root.",
        formula: "x(x+k) / (2x+k) = d<br>√ab shortcut: if (A+B) together take x days, A alone takes (x+a) days and B alone takes (x+b) days, then x = √(ab).",
      },
      {
        name: "Miscellaneous Questions",
        body: "Mixed questions that combine two or more of the ideas above — e.g. a percentage/fractional-work statement feeding into a combined-work or wages calculation. If p% of a job is done in d days, the whole job takes d×100/p (or d×n/m for a fraction m/n done in d days). If efficiency scales by a/b, time scales by the reciprocal b/a.",
      },
    ],
  },

  pipes: {
    group: "B", label: "Pipes & Cisterns",
    intro: "Exactly Time & Work, except an outlet pipe (drain) counts as NEGATIVE work.",
    concept: { title: "Same LCM method, just signed", body: "Use the Time & Work LCM trick unchanged — set total work (tank capacity) = LCM of all given times, give each inlet a POSITIVE efficiency and each outlet a NEGATIVE one, then just add." },
    formulas: [
      { n: "Inlet rate", eq: "Fills in a hrs ⇒ rate = +1/a" },
      { n: "Outlet rate", eq: "Empties in b hrs ⇒ rate = −1/b" },
      { n: "Net rate (opened together)", eq: "Net rate = sum of all individual rates (inlets positive, outlets negative)" },
      { n: "Time to fill/empty", eq: "Time = 1 / |net rate|", note: "If net rate is negative, the tank is draining overall, not filling." },
    ],
    example: { label: "Worked example — LCM method", lines: [
      "Pipe A fills in 6 hrs, pipe B (outlet) empties in 8 hrs — opened together",
      "{{step:Tank capacity = LCM(6,8) = 24 units}}",
      "A fills {{b:+4/hr}}, B drains {{b:−3/hr}} → net {{b:+1/hr}}",
      "Time to fill = 24/1 = {{b:24 hours}}",
    ]},
  },

  sici: {
    group: "B", label: "Simple & Compound Interest",
    intro: "SI grows linearly; CI grows on the growing amount (interest earns interest).",
    concept: { title: "CI−SI shortcuts beat computing both in full", body: "When a question only asks for the DIFFERENCE between CI and SI, never compute both amounts separately — use the 2-year or 3-year difference formula directly." },
    formulas: [
      { n: "Simple Interest", eq: "SI = (P × R × T) / 100" },
      { n: "Amount (SI)", eq: "A = P + SI = P × (1 + RT/100)" },
      { n: "Compound Interest", eq: "A = P × (1 + R/100)ᵀ<br>CI = A − P" },
      { n: "CI − SI (2 years)", eq: "CI − SI = P × (R/100)²", note: "A very common shortcut question — skip computing both in full." },
      { n: "CI − SI (3 years)", eq: "CI − SI = P × (R/100)² × (3 + R/100)" },
    ],
    example: { label: "Worked example", lines: [
      "P=1000, R=10%, T=2 years — CI−SI?",
      "{{step:CI−SI = P×(R/100)² = 1000×0.01}}",
      "= {{b:10}} (check: SI=200, CI=210, diff=10 ✓)",
    ]},
  },

  average: {
    group: "B", label: "Average",
    intro: 'The "typical" value of a set — but exam questions mostly test what happens when the set CHANGES.',
    concept: { title: "The deviation method", body: 'Instead of summing every value and dividing, guess a round "assumed average," find how far each value deviates from it (+/−), and average just the deviations. Add that to your assumed average.' },
    formulas: [
      { n: "Basic average", eq: "Average = (Sum of values) / (Number of values)" },
      { n: "Replacing one value", eq: "New average = Old average + (new value − old value)/n" },
      { n: "Average speed (equal distance)", eq: "2ab / (a+b)", note: "NOT (a+b)/2 — that's only correct for equal TIME, not equal distance. Classic trap." },
    ],
    example: { label: "Worked example — deviation method", lines: [
      "Average of 42, 45, 48, 51, 54?",
      "{{step:Assume average = 48 → deviations: −6,−3,0,+3,+6}}",
      "Sum of deviations = 0 → average = 48 + 0/5 = {{b:48}}",
    ]},
  },

  partnership: {
    group: "B", label: "Partnership",
    intro: "Profit is split in proportion to how much capital each partner put in, and for how long.",
    concept: { title: "It's always capital × time", body: 'Even "simple" partnership (same duration) is just the compound formula with time cancelled out — don\'t memorize two separate rules, just always multiply capital by time invested and take the ratio.' },
    formulas: [
      { n: "Simple partnership (same duration)", eq: "Profit ratio = ratio of capitals invested" },
      { n: "Compound partnership (different duration)", eq: "Profit ratio = capital × time, for each partner" },
    ],
    example: { label: "Worked example", lines: [
      "A invests 5000 for 12 months, B invests 6000 for 8 months — profit ratio?",
      "{{step:A: 5000×12=60000   B: 6000×8=48000}}",
      "Ratio = 60000:48000 = {{b:5:4}}",
    ]},
  },

  mixture: {
    group: "B", label: "Mixture & Alligation",
    intro: "The fast way to find how much of two things to mix to hit a target average/concentration.",
    concept: { title: "Draw the cross", body: "Write the two CPs/concentrations at the top-left and bottom-left, the mean in the middle, then cross-subtract diagonally to get the ratio directly — faster than setting up an equation." },
    formulas: [
      { n: "Alligation rule", eq: "(Qty cheaper) / (Qty dearer) = (CP dearer − Mean) / (Mean − CP cheaper)" },
    ],
    example: { label: "Worked example", lines: [
      "Mix tea at ₹20/kg and ₹30/kg to get a mix worth ₹24/kg — ratio?",
      "{{step:(30−24) : (24−20) = 6 : 4}}",
      "= {{b:3 : 2}} (cheaper : dearer)",
    ]},
  },

  std: {
    group: "C", label: "Speed, Time & Distance",
    intro: "The base chapter that Trains and Boats & Streams are both built on top of.",
    concept: { title: "Convert units before anything else", body: "The #1 error source: mixing km/h and m/s mid-calculation. Convert everything to the same unit FIRST, then plug into the formula." },
    formulas: [
      { n: "Core relation", eq: "Speed = Distance / Time" },
      { n: "km/h → m/s", eq: "multiply by 5/18" },
      { n: "m/s → km/h", eq: "multiply by 18/5" },
      { n: "Relative speed — same direction", eq: "Relative speed = difference of the two speeds" },
      { n: "Relative speed — opposite directions", eq: "Relative speed = sum of the two speeds" },
    ],
    example: { label: "Worked example", lines: [
      "A car covers 90 km in 2 hours — speed in m/s?",
      "{{step:Speed = 90/2 = 45 km/h}}",
      "45 × 5/18 = {{b:12.5 m/s}}",
    ]},
  },

  trains: {
    group: "C", label: "Trains",
    intro: "A special case of relative speed — the train's own LENGTH has to be covered too.",
    concept: { title: "Always convert to m/s first", body: "Train lengths are in meters but speeds are given in km/h — convert the speed to m/s before anything else, every single time." },
    formulas: [
      { n: "Crossing a pole / standing person", eq: "Time = (length of train) / (speed of train)" },
      { n: "Crossing a platform / bridge", eq: "Time = (length of train + length of platform) / speed" },
      { n: "Two trains, opposite directions", eq: "Time = (sum of lengths) / (sum of speeds)" },
      { n: "Two trains, same direction", eq: "Time = (sum of lengths) / (difference of speeds)" },
    ],
    example: { label: "Worked example", lines: [
      "Trains of 120m & 180m, speeds 54 km/h & 36 km/h, opposite directions — time to cross?",
      "{{step:Convert: 54→15 m/s, 36→10 m/s}}",
      "Time = (120+180)/(15+10) = 300/25 = {{b:12 seconds}}",
    ]},
  },

  boats: {
    group: "C", label: "Boats & Streams",
    intro: "The current either helps you (downstream) or fights you (upstream).",
    concept: { title: "Direction confusion is the only real trap", body: "Downstream = with the current = faster. Upstream = against the current = slower. Once you have both speeds, boat speed and stream speed are just their average and half-difference." },
    formulas: [
      { n: "Downstream speed", eq: "Boat speed + Stream speed" },
      { n: "Upstream speed", eq: "Boat speed − Stream speed" },
      { n: "Boat speed (still water)", eq: "(Downstream + Upstream) / 2" },
      { n: "Stream speed", eq: "(Downstream − Upstream) / 2" },
    ],
    example: { label: "Worked example", lines: [
      "Downstream speed 16 km/h, upstream speed 8 km/h — boat & stream speed?",
      "{{step:Boat = (16+8)/2 = 12 km/h}}",
      "Stream = (16−8)/2 = {{b:4 km/h}}",
    ]},
  },

  mensuration2d: {
    group: "D", label: "2D Mensuration",
    intro: "Area and perimeter of flat shapes.",
    concept: { title: "Heron's formula is a fallback, not a first choice", body: "Only reach for Heron's formula (needs all 3 sides) when you don't have a base and height. If you do, ½×base×height is always faster." },
    formulas: [
      { n: "Square", eq: "Area = a²<br>Perimeter = 4a" },
      { n: "Rectangle", eq: "Area = l×b<br>Perimeter = 2(l+b)" },
      { n: "Triangle", eq: "Area = ½ × base × height" },
      { n: "Triangle (Heron's)", eq: "Area = √[s(s−a)(s−b)(s−c)]<br>s = (a+b+c)/2", note: "Use only when you have all 3 sides and no height." },
      { n: "Circle", eq: "Area = πr²<br>Circumference = 2πr" },
      { n: "Parallelogram", eq: "Area = base × height" },
      { n: "Trapezium", eq: "Area = ½ × (sum of parallel sides) × height" },
    ],
    example: { label: "Worked example — Heron's check", lines: [
      "Triangle with sides 3, 4, 5 — area two ways",
      "{{step:Direct: ½×3×4 = 6}} (right triangle, legs 3 & 4)",
      "Heron's: s=6 → √(6×3×2×1) = √36 = {{b:6}} ✓ matches",
    ]},
  },

  mensuration3d: {
    group: "D", label: "3D Mensuration",
    intro: "Volume and surface area of solids.",
    concept: { title: "Melting & recasting = EQUATE VOLUMES, never surface area", body: 'The classic trap question: "a cube is melted and recast into spheres" — the material is conserved, so volumes are equal, NOT surface areas. Set Volume(before) = Volume(after) and solve.' },
    formulas: [
      { n: "Cube", eq: "Volume = a³<br>Surface area = 6a²<br>Diagonal = a√3" },
      { n: "Cuboid", eq: "Volume = l×b×h<br>Surface area = 2(lb+bh+hl)" },
      { n: "Cylinder", eq: "Volume = πr²h<br>Curved SA = 2πrh<br>Total SA = 2πr(r+h)" },
      { n: "Cone", eq: "Volume = ⅓πr²h<br>Curved SA = πrl,  l = √(r²+h²)<br>Total SA = πr(r+l)" },
      { n: "Sphere", eq: "Volume = 4/3 πr³<br>Surface area = 4πr²" },
      { n: "Hemisphere", eq: "Volume = 2/3 πr³<br>Curved SA = 2πr²<br>Total SA = 3πr²" },
    ],
    example: { label: "Worked example — melting & recasting", lines: [
      "A cylinder r=7, h=10 (π=22/7) — volume?",
      "{{step:Volume = 22/7 × 49 × 10}}",
      "= {{b:1540}} (if melted into another shape, THIS number is what you equate to)",
    ]},
  },
};

export const CHAPTER_GROUP_LABELS: Record<ChapterGroup, string> = {
  A: "Speed Maths", B: "Arithmetic", C: "Speed, Time & Distance", D: "Mensuration",
};
export const CHAPTER_GROUPS: ChapterGroup[] = ["A", "B", "C", "D"];

// ============== Square/cube-root shortcuts (shared math, platform-neutral) ==============
export const SQRT_LAST_DIGIT_MAP: Record<number, number[]> = { 0: [0], 1: [1, 9], 4: [2, 8], 5: [5], 6: [4, 6], 9: [3, 7] };
export const IMPOSSIBLE_SQUARE_ENDINGS = [2, 3, 7, 8];
export const CBRT_LAST_DIGIT_MAP: Record<number, number> = { 0: 0, 1: 1, 2: 8, 3: 7, 4: 4, 5: 5, 6: 6, 7: 3, 8: 2, 9: 9 };

export function findSquareExample(d: number): number {
  for (let n = 11; n < 60; n++) if ((n * n) % 10 === d) return n;
  return 11;
}
export function findCubeExample(d: number): number {
  for (let n = 11; n < 60; n++) if ((n * n * n) % 10 === d) return n;
  return 11;
}
export interface SquareRootSteps { sq: number; remaining: number; k: number; candidates: number[]; chosen: number; ans: number }
export function squareRootSteps(n: number): SquareRootSteps {
  const sq = n * n;
  const lastDigit = sq % 10;
  const remaining = Math.floor(sq / 100);
  let k = 0;
  while ((k + 1) * (k + 1) <= remaining) k++;
  const candidates = SQRT_LAST_DIGIT_MAP[lastDigit];
  const chosen = candidates.length === 1 ? candidates[0] : (remaining > k * (k + 1) ? Math.max(...candidates) : Math.min(...candidates));
  return { sq, remaining, k, candidates, chosen, ans: k * 10 + chosen };
}
export interface CubeRootSteps { cu: number; last3: number; rest: number; unitDigit: number; k: number; ans: number }
export function cubeRootSteps(n: number): CubeRootSteps {
  const cu = n * n * n;
  const last3 = cu % 1000;
  const rest = Math.floor(cu / 1000);
  const unitDigit = CBRT_LAST_DIGIT_MAP[last3 % 10];
  let k = 0;
  while ((k + 1) ** 3 <= rest) k++;
  return { cu, last3, rest, unitDigit, k, ans: k * 10 + unitDigit };
}

export function landmarkNums(kind: "sqrt" | "cbrt"): number[] {
  return kind === "sqrt" ? [50, 100, 150, 200, 250, 300] : [10, 20, 30, 40, 50, 60, 70, 80, 90];
}
