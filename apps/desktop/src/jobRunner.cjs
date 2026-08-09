/**
 * Phase C3 — background headless jobs via `grok -p` (single-turn).
 * Optional --worktree for isolation (C1/C5). Results feed inbox + artifacts.
 */
"use strict";

const { spawn } = require("node:child_process");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const MAX_CONCURRENT = 2;
const MAX_OUTPUT = 400_000;
const DEFAULT_TIMEOUT_MS = 15 * 60_000;

class JobRunner extends EventEmitter {
  /**
   * @param {{ resolveExecutable: () => string, grokEnv: () => Record<string,string>, stateDir: string }} opts
   */
  constructor(opts) {
    super();
    this.resolveExecutable = opts.resolveExecutable;
    this.grokEnv = opts.grokEnv;
    this.stateDir = opts.stateDir;
    this.storePath = path.join(opts.stateDir, "jobs.json");
    /** @type {Map<string, object>} */
    this.jobs = new Map();
    /** @type {string[]} */
    this.queue = [];
    /** @type {Map<string, import('child_process').ChildProcess>} */
    this.procs = new Map();
    this.running = 0;
    this._load();
  }

  _load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.storePath, "utf8"));
      const list = Array.isArray(raw.jobs) ? raw.jobs : [];
      for (const j of list.slice(-80)) {
        // Don't resurrect running as running
        if (j.status === "running" || j.status === "queued") {
          j.status = "failed";
          j.error = j.error || "Interrupted by app restart";
          j.finishedAt = j.finishedAt || new Date().toISOString();
        }
        this.jobs.set(j.id, j);
      }
    } catch {
      // fresh
    }
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(this.storePath), { recursive: true });
      const jobs = [...this.jobs.values()]
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 80);
      fs.writeFileSync(this.storePath, JSON.stringify({ jobs }, null, 2), "utf8");
    } catch {
      // ignore persist errors
    }
  }

  list(limit = 40) {
    return [...this.jobs.values()]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, limit);
  }

  get(id) {
    return this.jobs.get(id) || null;
  }

  /**
   * @param {{
   *   prompt: string,
   *   cwd: string,
   *   title?: string,
   *   worktree?: string,
   *   worktreeRef?: string,
   *   permissionMode?: string,
   *   model?: string,
   *   effort?: string,
   *   maxTurns?: number,
   *   timeoutMs?: number,
   * }} spec
   */
  enqueue(spec) {
    const prompt = String(spec.prompt || "").trim();
    const cwd = String(spec.cwd || "").trim();
    if (!prompt) throw new Error("Job prompt is required");
    if (!cwd || !fs.existsSync(cwd)) throw new Error("Valid workspace cwd is required");

    const id = randomUUID();
    const job = {
      id,
      title: (spec.title || prompt).slice(0, 72),
      prompt,
      cwd,
      worktree: spec.worktree ? String(spec.worktree).trim() : "",
      worktreeRef: spec.worktreeRef ? String(spec.worktreeRef).trim() : "",
      permissionMode: spec.permissionMode || "auto",
      model: spec.model || "",
      effort: spec.effort || "",
      maxTurns: Number(spec.maxTurns) || 0,
      timeoutMs: Number(spec.timeoutMs) || DEFAULT_TIMEOUT_MS,
      status: "queued",
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      stdout: "",
      stderr: "",
      code: null,
      error: null,
      artifacts: [],
      inbox: false,
      read: false,
    };
    this.jobs.set(id, job);
    this.queue.push(id);
    this._save();
    this.emit("update", job);
    this._pump();
    return job;
  }

  cancel(id) {
    const job = this.jobs.get(id);
    if (!job) return { ok: false, message: "Not found" };
    if (job.status === "queued") {
      this.queue = this.queue.filter((x) => x !== id);
      job.status = "cancelled";
      job.finishedAt = new Date().toISOString();
      this._save();
      this.emit("update", job);
      return { ok: true };
    }
    if (job.status === "running") {
      const proc = this.procs.get(id);
      try {
        proc?.kill();
      } catch {
        // ignore
      }
      job.status = "cancelled";
      job.finishedAt = new Date().toISOString();
      this.procs.delete(id);
      this.running = Math.max(0, this.running - 1);
      this._save();
      this.emit("update", job);
      this._pump();
      return { ok: true };
    }
    return { ok: false, message: `Cannot cancel ${job.status}` };
  }

  markRead(id) {
    const job = this.jobs.get(id);
    if (!job) return null;
    job.read = true;
    this._save();
    this.emit("update", job);
    return job;
  }

  clearFinished() {
    for (const [id, j] of this.jobs) {
      if (j.status === "done" || j.status === "failed" || j.status === "cancelled") {
        this.jobs.delete(id);
      }
    }
    this._save();
    this.emit("list");
  }

  inbox(unreadOnly = false) {
    return this.list(80).filter(
      (j) =>
        j.inbox &&
        (j.status === "done" || j.status === "failed" || j.status === "cancelled") &&
        (!unreadOnly || !j.read),
    );
  }

  _pump() {
    while (this.running < MAX_CONCURRENT && this.queue.length) {
      const id = this.queue.shift();
      const job = this.jobs.get(id);
      if (!job || job.status !== "queued") continue;
      this._start(job);
    }
  }

  _start(job) {
    this.running += 1;
    job.status = "running";
    job.startedAt = new Date().toISOString();
    this.emit("update", job);
    this._save();

    const exe = this.resolveExecutable();
    const args = ["--cwd", job.cwd, "-p", job.prompt, "--permission-mode", job.permissionMode || "auto"];
    if (job.worktree) {
      args.push("--worktree", job.worktree);
      if (job.worktreeRef) args.push("--worktree-ref", job.worktreeRef);
    }
    if (job.model) args.push("--model", job.model);
    if (job.effort) args.push("--reasoning-effort", job.effort);
    if (job.maxTurns > 0) args.push("--max-turns", String(job.maxTurns));
    // Prefer plain text stdout for headless
    args.push("--output-format", "text");

    let stdout = "";
    let stderr = "";
    let settled = false;

    const child = spawn(exe, args, {
      cwd: job.cwd,
      env: { ...process.env, ...this.grokEnv() },
      windowsHide: true,
      shell: false,
    });
    this.procs.set(job.id, child);

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      if (!settled) {
        settled = true;
        this._finish(job, {
          status: "failed",
          code: -1,
          error: `Timeout after ${job.timeoutMs}ms`,
          stdout,
          stderr,
        });
      }
    }, job.timeoutMs);

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      stdout = (stdout + chunk).slice(-MAX_OUTPUT);
      job.stdout = stdout;
      this.emit("progress", { id: job.id, stdoutLen: stdout.length });
    });
    child.stderr?.on("data", (chunk) => {
      stderr = (stderr + chunk).slice(-MAX_OUTPUT);
      job.stderr = stderr;
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      this._finish(job, {
        status: "failed",
        code: -1,
        error: err.message || String(err),
        stdout,
        stderr,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      const ok = code === 0;
      this._finish(job, {
        status: ok ? "done" : "failed",
        code: code == null ? -1 : code,
        error: ok ? null : `Exit code ${code}`,
        stdout,
        stderr,
      });
    });
  }

  _finish(job, result) {
    this.procs.delete(job.id);
    this.running = Math.max(0, this.running - 1);
    job.status = result.status;
    job.code = result.code;
    job.error = result.error;
    job.stdout = result.stdout || "";
    job.stderr = result.stderr || "";
    job.finishedAt = new Date().toISOString();
    job.inbox = true;
    job.read = false;

    // Auto artifact: job summary
    const summary = (job.stdout || job.stderr || job.error || "").trim().slice(0, 12000);
    if (summary) {
      job.artifacts.push({
        id: randomUUID(),
        type: "job_output",
        title: job.title,
        content: summary,
        jobId: job.id,
        createdAt: job.finishedAt,
        worktree: job.worktree || "",
      });
    }

    this._save();
    this.emit("update", job);
    this.emit("inbox", job);
    this._pump();
  }
}

module.exports = { JobRunner, MAX_CONCURRENT };
