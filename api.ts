import type { AttemptRecord, AiReview, BankQuestion, BankSectionSummary, LibraryFileLink, LibraryItem, LibraryListResponse, Paper, PerformanceInput, PracticePaperRequest } from "./types";
import { getStorage } from "./storage";

export const SESSION_KEY = "pariksha_session";

let API_URL: string | undefined;

/** Call once at app startup (web: pass import.meta.env.VITE_API_URL; RN: pass
 * whatever env/config mechanism that platform uses). */
export function configureApi(apiUrl: string | undefined): void {
  API_URL = apiUrl;
}

export interface Session { token: string; email: string; plan?: "free" | "premium" }

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

export function me(): Promise<{ email: string; plan: "free" | "premium" }> {
  return request<{ email: string; plan: "free" | "premium" }>("/me");
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
