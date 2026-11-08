export type QType = "num" | "mc";

export interface TableSpec {
  head: string[];
  rows: (string | number)[][];
}

export interface RawQuestion {
  id?: string;
  topic?: string;
  type?: string;
  question?: string;
  text?: string;
  answer?: number | string;
  options?: (string | number)[];
  answer_index?: number;
  table?: TableSpec;
  image?: string;
  solution?: string;
  explanation?: string;
}

export interface RawSection {
  name?: string;
  questions?: RawQuestion[];
}

export interface RawPaper {
  title?: string;
  exam?: string;
  duration_minutes?: number;
  negative_marking?: number;
  sections?: RawSection[];
  questions?: RawQuestion[];
}

export interface Question {
  id: string;
  section: string;
  topic: string;
  type: QType;
  text: string;
  table?: TableSpec;
  image?: string;
  solution?: string;
  options?: string[];
  ans: number;
}

export interface SectionInfo {
  name: string;
  from: number;
  to: number;
  /** optional: this section gets its own clock (minutes). */
  minutes?: number;
}

export interface Paper {
  title: string;
  exam: string;
  durationMinutes: number;
  negativeMarking: number;
  sections: SectionInfo[];
  questions: Question[];
}

/** A question starred while taking a mock or practice session (live, or
 * from the post-exam Report review) - a standalone copy of the question so
 * it survives independent of the source attempt, filed under its own
 * section/chapter so the Bookmarks tab can group by chapter. */
export interface BookmarkIn {
  section: string;
  topic: string;
  type: QType;
  text: string;
  table?: TableSpec;
  image?: string;
  solution?: string;
  options?: string[];
  ans: number;
  given?: number | null;
  wasCorrect?: boolean | null;
  sourceLabel: string;
  sourceWhen?: number;
}

export interface Bookmark extends BookmarkIn {
  bookmarkId: string;
  note?: string;
  createdAt: number;
}

export interface LibraryFile {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface LibraryItem {
  itemId: string;
  title: string;
  files: LibraryFile[];
  createdAt: number;
  /** Omitted on the paginated list endpoint (can be several KB per item) -
   * present when an item is fetched individually. Use hasPaper/questionCount
   * for list rendering instead of checking this field's presence. */
  paper?: Paper;
  hasPaper: boolean;
  questionCount?: number;
  /** A real render of the PDF's first page, generated asynchronously a few
   * seconds after upload (not available instantly) - undefined until then,
   * and for non-PDF uploads. */
  thumbnailUrl?: string;
}

export interface LibraryListResponse {
  items: LibraryItem[];
  nextCursor: string | null;
}

export interface LibraryFileLink {
  fileName: string;
  url: string;
}

export interface QState {
  given: number | null;
  marked: boolean;
  visited: boolean;
  timeMs: number;
}

export type Status = "notVisited" | "notAnswered" | "answered" | "marked" | "answeredMarked";

export function statusOf(q: QState): Status {
  if (q.given !== null && q.marked) return "answeredMarked";
  if (q.marked) return "marked";
  if (q.given !== null) return "answered";
  if (q.visited) return "notAnswered";
  return "notVisited";
}

/** One question's detail as stored with an attempt - powers the cross-attempt
 * mistake journal and per-question notes. Text/options are truncated before
 * saving to keep attempt records well under DynamoDB's per-item size limit. */
export interface AttemptQuestionRecord {
  id: string;
  topic: string;
  type: QType;
  text: string;
  options?: string[];
  ans: number;
  given: number | null;
  timeMs: number;
  note?: string;
}

export interface AttemptRecord {
  when: number;
  title: string;
  net: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  secs: number;
  accuracy?: number;
  avgSec?: number;
  byTopic?: Record<string, { ok: number; att: number }>;
  tabSwitches?: number;
  exam?: string;
  /** Absent on attempts saved before this field existed. */
  questions?: AttemptQuestionRecord[];
}

export interface TopicStat {
  n: number;
  att: number;
  ok: number;
  ms: number;
}

export interface ExamResult {
  paper: Paper;
  states: QState[];
  elapsedSec: number;
  correct: number;
  wrong: number;
  skipped: number;
  attempted: number;
  net: number;
  accuracy: number;
  avgSec: number;
  byTopic: Record<string, TopicStat>;
  tabSwitches: number;
}

export interface TopicSummary {
  topic: string;
  attempted: number;
  total: number;
  correct: number;
  avgSec?: number;
}

export interface SlowAnswer {
  question: number;
  topic: string;
  seconds: number;
  correct: boolean;
}

export interface PerformanceInput {
  examTitle: string;
  examCategory: string;
  net: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  attempted: number;
  accuracy: number;
  avgSec: number;
  tabSwitches: number;
  topics: TopicSummary[];
  slowest: SlowAnswer[];
}

export interface ReviewPoint {
  title: string;
  detail: string;
}

export interface StudyPlanDay {
  day: string;
  title: string;
  detail: string;
  minutes: number;
}

export interface AiReview {
  summary: string;
  strengths: ReviewPoint[];
  weaknesses: ReviewPoint[];
  plan: StudyPlanDay[];
}

export type Difficulty = "easy" | "medium" | "hard";

/** One personally-tagged question in the Master Vault question bank — distinct
 * from Question/Paper, which describe one fixed, ordered exam. A BankQuestion
 * is independently filterable/browsable by section+chapter+difficulty and only
 * becomes part of a Paper when a practice session is assembled from a batch of
 * them (see api.ts's generatePracticePaper). */
export interface BankQuestion {
  questionId: string;
  section: string;
  chapter: string;
  /** Finer-grained than chapter - e.g. chapter "Time & Work" might have
   * sub-concepts like "Combined Work" or "People Joining/Leaving Mid-Task".
   * Optional: older/un-tagged questions simply have no sub-concept filter. */
  subConcept?: string;
  difficulty: Difficulty;
  type: QType;
  text: string;
  table?: TableSpec;
  image?: string;
  solution?: string;
  options?: string[];
  answer_index?: number;
  answer?: number;
  createdAt: number;
}

export interface BankSectionSummary {
  section: string;
  chapter: string;
  count: number;
  byDifficulty: { easy: number; medium: number; hard: number };
}

export interface BankSubConceptSummary {
  chapter: string;
  subConcept: string;
  count: number;
}

export interface PracticePaperRequest {
  section: string;
  chapters: string[];
  /** When set, only sample questions matching one of these (chapter,
   * subConcept) pairs within the chosen chapters. Each entry is encoded as
   * "chapter|subConcept" - plain subConcept names repeat across chapters
   * (e.g. every chapter has a "Miscellaneous Questions" group), so the pair
   * is required to avoid matching the wrong chapter's identically-named
   * sub-concept. */
  subConcepts?: string[];
  difficulty?: Difficulty;
  count: number;
  durationMinutes: number;
  negativeMarking?: number;
}

export interface ExamSettings {
  monitorTabSwitches: boolean;
  /** Renders the exam inside a small fixed "monitor" box, scaled up, so you must
   * scroll to see everything — like a real exam-center kiosk display. */
  simulateZoom: boolean;
  /** Replaces the cursor with one that eases toward the real pointer with a lag,
   * for practicing precise clicks on a sluggish exam-center mouse. */
  simulateLaggyCursor: boolean;
  /** Swaps the instructions + exam screens for a look-alike of the real IBPS/TCS
   * iON test portal (paginated instructions, status-legend colors, radio options,
   * candidate photo panel, keyboard-lock warning) instead of Pariksha's own skin. */
  examCenterSkin: boolean;
}

/** One of the predefined bank exams a user can track a study plan toward. */
export type TargetExamName = "IBPS PO" | "SBI PO" | "IBPS Clerk" | "SBI Clerk" | "RRB PO" | "RRB Clerk";
export type TargetExamStage = "prelims" | "mains" | "both";

export interface TargetExamPhase {
  label: string;
  weeks: number;
  description: string;
  focusTopics: string[];
  /** Day offsets from the plan's acceptedAt, filled in server-side from `weeks` */
  startDay: number;
  endDay: number;
}

export interface TopicContractChapter {
  chapter: string;
  reason: string;
}

export interface TopicContractBucket {
  label: string;
  /** Full detail string - real-exam-weight nuance, shown as a tooltip, not inline prose. */
  weightNote: string;
  /** Parsed representative question count for a clean "~24/40" badge. */
  weightCount: number;
  sectionTotal: number;
  chapters: TopicContractChapter[];
}

export interface TopicContractSection {
  section: string;
  buckets: TopicContractBucket[];
  unmatched: string[];
}

export interface TargetExamPlan {
  phases: TargetExamPhase[];
  focusDistribution: Record<string, number>;
  dailyHoursEstimate: number;
  /** Deterministic chapter-allocation contract this plan was built around -
   * real exam weightage + the student's own state decided these chapters
   * server-side, before the AI ever ran. Empty for sections/exams it
   * couldn't compute one for. */
  topicContract: TopicContractSection[];
  /** Snapshot estimate at generation time, shown in the contract review
   * before accepting - the dashboard recalculates the live version of both
   * on every read (TargetExamState.todayProgress.overall.target and
   * .recommendedMocksThisWeek) instead of trusting this. */
  dailyQuestionTarget: number;
  mocksPerWeek: number;
}

export type ConfidenceLevel = "very_low" | "average" | "excellent";

/** The user's starting point for one bank section, collected during Target
 * Exam setup - either self-rated or measured via the optional inline
 * diagnostic quiz (diagnosticAccuracy set), which the planner trusts more. */
export interface SectionConfidence {
  section: string;
  level: ConfidenceLevel;
  diagnosticAccuracy?: number;
  /** Per-chapter accuracy from the diagnostic quiz ("Simplification": 80, ...)
   * - a section-level rating alone can't tell the planner WHICH chapters
   * inside the section to actually focus on, so this is the real signal it
   * uses to pick focusTopics within the section when present. */
  chapterAccuracy?: Record<string, number>;
  /** Manual per-chapter self-rating, for a user who knows exactly where they
   * stand and would rather say so directly than take the diagnostic quiz.
   * Weaker signal than chapterAccuracy (a guess, not a measurement) but still
   * finer-grained than the section-level `level` alone. */
  chapterLevels?: Record<string, ConfidenceLevel>;
}

export interface TargetExamGenerateRequest {
  exam: TargetExamName;
  stage: TargetExamStage;
  /** ISO date, "2026-12-19" */
  examDate: string;
  /** Always the PERCENTAGE of totalMarks (0-100) - not every exam is out
   * of 100 (RRB Prelims is out of 80, etc.), so the UI collects raw marks
   * and converts before sending this. */
  targetCutoff: number;
  /** Total marks for the exam/stage the user picked - purely for display
   * ("62 / 80" instead of a bare, exam-agnostic "62%"). Defaults to 100. */
  totalMarks: number;
  sectionConfidence: SectionConfidence[];
}

export interface TargetExamAcceptRequest extends TargetExamGenerateRequest {
  plan: TargetExamPlan;
}

export interface AdaptiveLogEntry {
  date: number;
  message: string;
  detail: string;
  kind: "info" | "warning" | "good";
}

export interface TargetExamTask {
  topic: string;
  label: string;
  meta: string;
  done: boolean;
}

export interface CalendarDay {
  /** "2026-11-07" */
  date: string;
  /** "0" none, "1"/"2"/"3" partial->full activity, "miss" a plan day with zero attempts */
  level: "0" | "1" | "2" | "3" | "miss";
}

/** Today's solved/accuracy/time against a daily question target, at
 * whatever granularity (overall / a section / a topic) - built from every
 * attempt logged today, mock or custom practice alike. */
export interface QuestionProgress {
  target: number;
  solved: number;
  correct: number;
  accuracy: number;
  remaining: number;
  avgTimeSec: number;
}

export interface SectionQuestionProgress extends QuestionProgress {
  section: string;
}

export interface TopicQuestionProgress extends QuestionProgress {
  topic: string;
  section: string;
}

export interface TodayProgress {
  overall: QuestionProgress;
  bySection: SectionQuestionProgress[];
  byTopic: TopicQuestionProgress[];
}

/** Not a single-day number - how many questions you'd need to attempt per
 * section, on average across recent attempts, to realistically hit your
 * target cutoff at your own current accuracy there - versus what you're
 * actually averaging. A volume check, separate from accuracy. */
export interface SectionAttemptInsight {
  section: string;
  requiredAttempts: number;
  avgAttempts: number;
  isShort: boolean;
  message?: string;
}

export interface TargetExamState {
  exam: string;
  stage: TargetExamStage;
  examDate: string;
  targetCutoff: number;
  totalMarks: number;
  sectionConfidence: SectionConfidence[];
  createdAt: number;
  acceptedAt: number;
  plan: TargetExamPlan;
  adaptiveLog: AdaptiveLogEntry[];
  daysLeft: number;
  currentAvgAccuracy: number;
  readiness: number;
  readinessStatus: "ahead" | "on_track" | "behind";
  streak: number;
  currentPhaseIndex: number;
  todayTasks: TargetExamTask[];
  calendar: CalendarDay[];
  missedDaysThisWeek: number;
  todayProgress: TodayProgress;
  attemptConsistency: SectionAttemptInsight[];
  /** Recalculated fresh on every read from the CURRENT days-left and pace -
   * not the frozen generation-time snapshot on plan.mocksPerWeek. */
  recommendedMocksThisWeek: number;
}

/** AI-resolve fallback for a weak-topic name that didn't match any bank
 * chapter via the deterministic findMatch() logic. `section`/`chapter` are
 * set when a confident match was found (from cache or a fresh AI call,
 * indicated by `source`); otherwise `candidates` holds 0-3 options for the
 * user to pick from (zero means genuinely nothing fit). */
export interface TopicResolveResponse {
  section?: string;
  chapter?: string;
  source?: "cache" | "ai";
  candidates: { section: string; chapter: string }[];
}
