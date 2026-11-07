import type { AttemptRecord, AiReview, BankQuestion, BankSectionSummary, LibraryFileLink, LibraryItem, LibraryListResponse, Paper, PerformanceInput, PracticePaperRequest, TargetExamAcceptRequest, TargetExamGenerateRequest, TargetExamPlan, TargetExamState, TopicResolveResponse } from "./types";
import { getStorage } from "./storage";

export const SESSION_KEY = "pariksha_session";

let API_URL: string | undefined;

/** Call once at app startup (web: pass import.meta.env.VITE_API_URL; RN: pass
 * whatever env/config mechanism that platform uses). */
export function configureApi(apiUrl: string | undefined): void {
  API_URL = apiUrl;
}

export interface Session { token: string; email: string; plan?: "free" | "premium"; name?: string | null; avatarUrl?: string | null }

/** Gates the Master Vault question-bank feature — the one place both platforms
 * check it, so showing/hiding its UI never duplicates the plan logic. The
 * backend enforces this independently on every /bank/* route; this is only
 * for deciding what to render. */
export function canUseBankFeature(session: Session | null): boolean {
  return session?.plan === "premium";
}

export function backendEnabled(): boolean {
  return Boolean(API_URL);
}

export function getSession(): Session | null {
  try {
    const raw = getStorage().getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null): void {
  try {
    if (s) getStorage().setItem(SESSION_KEY, JSON.stringify(s));
    else getStorage().removeItem(SESSION_KEY);
  } catch { /* storage may be blocked */ }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("No backend configured.");
  const session = getSession();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Request failed (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

export function signup(email: string, password: string): Promise<Session> {
  return request<Session>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function login(email: string, password: string): Promise<Session> {
  return request<Session>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function fetchAttempts(): Promise<AttemptRecord[]> {
  return request<AttemptRecord[]>("/attempts");
}

export function saveAttempt(rec: AttemptRecord): Promise<AttemptRecord> {
  return request<AttemptRecord>("/attempts", { method: "POST", body: JSON.stringify(rec) });
}

export function updateQuestionNote(when: number, qIndex: number, note: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/attempts/${when}/questions/${qIndex}/note`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function analyzePerformance(input: PerformanceInput): Promise<AiReview> {
  return request<AiReview>("/analyze", { method: "POST", body: JSON.stringify(input) });
}

/** One bounded page of Paper Vault items (paper content omitted - see
 * LibraryItem.hasPaper/questionCount). Pass the previous call's nextCursor
 * to fetch the next page. */
export function fetchLibrary(cursor?: string): Promise<LibraryListResponse> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return request<LibraryListResponse>(`/library${qs}`);
}

/** Fetches one item with its full paper (questions/options/answers) - call
 * this when the user actually opens an item, not for list rendering. */
export function fetchLibraryItem(itemId: string): Promise<LibraryItem> {
  return request<LibraryItem>(`/library/${itemId}`);
}

export interface LibraryUploadFile { fileName: string; fileType: string; fileBase64: string }

export function uploadLibraryFiles(files: LibraryUploadFile[], title?: string): Promise<LibraryItem> {
  return request<LibraryItem>("/library", { method: "POST", body: JSON.stringify({ files, title }) });
}

export function getLibraryFileLinks(itemId: string): Promise<LibraryFileLink[]> {
  return request<LibraryFileLink[]>(`/library/${itemId}/files`);
}

export function saveLibraryPaper(itemId: string, paper: Paper): Promise<LibraryItem> {
  return request<LibraryItem>(`/library/${itemId}`, { method: "PUT", body: JSON.stringify({ paper }) });
}

export function deleteLibraryItem(itemId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/library/${itemId}`, { method: "DELETE" });
}

export interface MeResponse { email: string; plan: "free" | "premium"; name?: string | null; avatarUrl?: string | null }

export function me(): Promise<MeResponse> {
  return request<MeResponse>("/me");
}

export function updateProfile(name: string): Promise<MeResponse> {
  return request<MeResponse>("/me", { method: "PUT", body: JSON.stringify({ name }) });
}

export function uploadAvatar(fileBase64: string, fileType: string): Promise<MeResponse> {
  return request<MeResponse>("/me/avatar", { method: "POST", body: JSON.stringify({ fileBase64, fileType }) });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export interface BankQuestionInput {
  section: string;
  chapter: string;
  difficulty: "easy" | "medium" | "hard";
  type: "mc" | "num";
  text: string;
  options?: string[];
  answer_index?: number;
  answer?: number;
  solution?: string;
}

export function ingestBankQuestions(questions: BankQuestionInput[]): Promise<{ ingested: number; errors: string[] }> {
  return request<{ ingested: number; errors: string[] }>("/bank/ingest", {
    method: "POST",
    body: JSON.stringify({ questions }),
  });
}

export function fetchBankSections(): Promise<BankSectionSummary[]> {
  return request<BankSectionSummary[]>("/bank/sections");
}

export function fetchBankQuestions(section: string, chapters: string[], difficulty?: string): Promise<BankQuestion[]> {
  const params = new URLSearchParams({ section, chapters: chapters.join(",") });
  if (difficulty) params.set("difficulty", difficulty);
  return request<BankQuestion[]>(`/bank/questions?${params.toString()}`);
}

export function generatePracticePaper(req: PracticePaperRequest): Promise<Paper> {
  return request<Paper>("/bank/practice-paper", { method: "POST", body: JSON.stringify(req) });
}

/** Gemini-generated plan, NOT yet persisted - the review step before accept(). */
export function generateTargetExamPlan(req: TargetExamGenerateRequest): Promise<TargetExamPlan> {
  return request<TargetExamPlan>("/target-exam/generate", { method: "POST", body: JSON.stringify(req) });
}

export function acceptTargetExamPlan(req: TargetExamAcceptRequest): Promise<TargetExamState> {
  return request<TargetExamState>("/target-exam/accept", { method: "POST", body: JSON.stringify(req) });
}

/** Throws (404) if the user has no active plan yet - callers should catch
 * and fall back to the setup wizard. */
export function fetchTargetExam(): Promise<TargetExamState> {
  return request<TargetExamState>("/target-exam");
}

/** Last-resort fallback for a weak topic findMatch() couldn't place - tries
 * a per-user cache before ever calling Gemini (see backend for the full
 * tiering). May return a confident match, or 0-3 candidates to ask the user
 * about. */
export function resolveTopicChapter(topic: string): Promise<TopicResolveResponse> {
  return request<TopicResolveResponse>("/bank/resolve-topic", { method: "POST", body: JSON.stringify({ topic }) });
}

/** Call once the user picks one of resolveTopicChapter's candidates - caches
 * it so this exact topic resolves instantly (no AI) next time. */
export function confirmTopicChapter(topic: string, section: string, chapter: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/bank/confirm-topic", { method: "POST", body: JSON.stringify({ topic, section, chapter }) });
}
