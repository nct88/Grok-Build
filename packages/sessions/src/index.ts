import { createReadStream } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

export interface GrokSessionSummary {
  id: string;
  cwd: string;
  title: string;
  model?: string;
  updatedAt: string;
  messageCount: number;
  reasoningEffort?: string;
}

interface SummaryJson {
  info?: { id?: string; cwd?: string };
  session_summary?: string;
  generated_title?: string;
  created_at?: string;
  updated_at?: string;
  last_active_at?: string;
  num_chat_messages?: number;
  num_messages?: number;
  current_model_id?: string;
  reasoning_effort?: string;
}

function normalizePath(value: string): string {
  return value.replaceAll("/", "\\").toLowerCase();
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateTitle(value: string, max = 72): string {
  const text = collapseWhitespace(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function extractText(
  content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((p) => (typeof p?.text === "string" ? p.text : "")).filter(Boolean).join("\n");
}

function titleFromUserMessageText(raw: string): string | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  const queryMatch = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/i);
  if (queryMatch?.[1]) {
    const title = truncateTitle(queryMatch[1]);
    return title || undefined;
  }
  if (
    text.includes("<system-reminder>") ||
    text.includes("<user_info>") ||
    text.includes("<git_status>")
  ) {
    return undefined;
  }
  const title = truncateTitle(text);
  return title || undefined;
}

async function readFirstUserPromptTitle(sessionDir: string): Promise<string | undefined> {
  const historyPath = join(sessionDir, "chat_history.jsonl");
  try {
    const stream = createReadStream(historyPath, { encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    try {
      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let row: { type?: string; role?: string; content?: string | Array<{ text?: string }> };
        try {
          row = JSON.parse(trimmed);
        } catch {
          continue;
        }
        if (row.type !== "user" && row.role !== "user") continue;
        const title = titleFromUserMessageText(extractText(row.content));
        if (title) return title;
      }
    } finally {
      rl.close();
      stream.destroy();
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function resolveSessionTitle(options: {
  sessionDir: string;
  sessionId: string;
  generatedTitle?: string;
  sessionSummary?: string;
}): Promise<{ title: string; hasUserContent: boolean }> {
  if (options.generatedTitle?.trim()) {
    return { title: truncateTitle(options.generatedTitle), hasUserContent: true };
  }
  if (options.sessionSummary?.trim()) {
    return { title: truncateTitle(options.sessionSummary), hasUserContent: true };
  }
  const fromHistory = await readFirstUserPromptTitle(options.sessionDir);
  if (fromHistory) {
    return { title: fromHistory, hasUserContent: true };
  }
  // No real user chat yet — ACP still creates a session shell on Connect with
  // system rows that inflate num_chat_messages. UI should hide these.
  // No user message yet — never use raw session UUID as the visible title
  return {
    title: "Untitled chat",
    hasUserContent: false,
  };
}

/** List sessions under ~/.grok/sessions (same layout as Grok CLI / workbench). */
export async function listLocalSessions(options: {
  cwd?: string;
  limit?: number;
  grokHome?: string;
} = {}): Promise<GrokSessionSummary[]> {
  const root = join(options.grokHome ?? join(homedir(), ".grok"), "sessions");
  let cwdRoots: string[] = [];
  try {
    cwdRoots = (await readdir(root, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }

  const sessions: GrokSessionSummary[] = [];
  for (const cwdRoot of cwdRoots) {
    const cwdPath = join(root, cwdRoot);
    let sessionDirs: string[] = [];
    try {
      sessionDirs = (await readdir(cwdPath, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      continue;
    }
    for (const sessionId of sessionDirs) {
      const sessionDir = join(cwdPath, sessionId);
      try {
        const raw = await readFile(join(sessionDir, "summary.json"), "utf8");
        const summary = JSON.parse(raw) as SummaryJson;
        const cwd = summary.info?.cwd ?? decodeURIComponent(cwdRoot);
        if (options.cwd && normalizePath(cwd) !== normalizePath(options.cwd)) continue;
        const id = summary.info?.id ?? sessionId;
        const { title, hasUserContent } = await resolveSessionTitle({
          sessionDir,
          sessionId: id,
          ...(summary.generated_title ? { generatedTitle: summary.generated_title } : {}),
          ...(summary.session_summary ? { sessionSummary: summary.session_summary } : {}),
        });
        const rawCount = summary.num_chat_messages ?? summary.num_messages ?? 0;
        // Empty Connect shells often report num_chat_messages > 0 (system rows only).
        const messageCount = hasUserContent ? rawCount : 0;
        sessions.push({
          id,
          cwd,
          title,
          ...(summary.current_model_id ? { model: summary.current_model_id } : {}),
          updatedAt:
            summary.last_active_at ??
            summary.updated_at ??
            summary.created_at ??
            new Date(0).toISOString(),
          messageCount,
          ...(summary.reasoning_effort ? { reasoningEffort: summary.reasoning_effort } : {}),
        });
      } catch {
        // skip
      }
    }
  }
  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sessions.slice(0, options.limit ?? 40);
}

export interface TranscriptMessage {
  role: "user" | "assistant" | "system" | "other";
  text: string;
}

/**
 * Load user/assistant turns from chat_history.jsonl for UI replay.
 * Skips system scaffolding and empty synthetic rows.
 */
export async function readSessionTranscript(options: {
  sessionId: string;
  grokHome?: string;
  limit?: number;
}): Promise<TranscriptMessage[]> {
  const sessionDir = await findSessionDirectory({
    sessionId: options.sessionId,
    ...(options.grokHome ? { grokHome: options.grokHome } : {}),
  });
  if (!sessionDir) return [];

  const historyPath = join(sessionDir, "chat_history.jsonl");
  const out: TranscriptMessage[] = [];
  const limit = options.limit ?? 200;
  try {
    const stream = createReadStream(historyPath, { encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    try {
      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let row: {
          type?: string;
          role?: string;
          content?: string | Array<{ type?: string; text?: string }>;
          synthetic_reason?: string;
        };
        try {
          row = JSON.parse(trimmed);
        } catch {
          continue;
        }
        const type = (row.type || row.role || "").toLowerCase();
        if (type === "system" || type === "reasoning") continue;
        if (row.synthetic_reason && row.synthetic_reason !== "user") {
          const text = extractText(row.content);
          if (!text.includes("<user_query>")) continue;
        }
        let role: TranscriptMessage["role"] = "other";
        if (type === "user") role = "user";
        else if (type === "assistant" || type === "agent") role = "assistant";
        else continue;

        let text = extractText(row.content).trim();
        if (!text) continue;
        // Unwrap <user_query> if present
        const q = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/i);
        if (q?.[1]) text = q[1].trim();
        // Skip huge instruction dumps
        if (text.includes("<system-reminder>") && text.length > 2000) continue;
        if (text.length > 50_000) text = `${text.slice(0, 50_000)}\n…`;
        out.push({ role, text });
        if (out.length >= limit) break;
      }
    } finally {
      rl.close();
      stream.destroy();
    }
  } catch {
    return [];
  }
  return out;
}

/** Locate a session folder by id under ~/.grok/sessions/<cwd>/<id>. */
export async function findSessionDirectory(options: {
  sessionId: string;
  grokHome?: string;
}): Promise<string | undefined> {
  const root = join(options.grokHome ?? join(homedir(), ".grok"), "sessions");
  let cwdRoots: string[] = [];
  try {
    cwdRoots = (await readdir(root, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return undefined;
  }
  for (const cwdRoot of cwdRoots) {
    const sessionDir = join(root, cwdRoot, options.sessionId);
    try {
      await readFile(join(sessionDir, "summary.json"), "utf8");
      return sessionDir;
    } catch {
      // next
    }
  }
  return undefined;
}

export async function runGrokCli(options: {
  executable: string;
  args: string[];
  cwd?: string;
  environment?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve) => {
    const child = spawn(options.executable, options.args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.environment },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill(), options.timeoutMs ?? 30_000);
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (c: string) => {
      stdout = `${stdout}${c}`.slice(-200_000);
    });
    child.stderr?.on("data", (c: string) => {
      stderr = `${stderr}${c}`.slice(-50_000);
    });
    child.once("error", (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout: "", stderr: err.message });
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}
