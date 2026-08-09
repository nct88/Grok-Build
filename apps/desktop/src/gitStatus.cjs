/**
 * Phase B7 / P2 — git status for workspace strip (+ richer fields).
 */
const { execFile } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

function run(cwd, args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    execFile(
      "git",
      args,
      { cwd, timeout: timeoutMs, windowsHide: true, maxBuffer: 2 * 1024 * 1024 },
      (err, stdout, stderr) => {
        resolve({
          ok: !err,
          code: err && err.code != null ? err.code : 0,
          stdout: String(stdout || ""),
          stderr: String(stderr || ""),
        });
      },
    );
  });
}

/**
 * Parse porcelain paths (supports rename "R  old -> new").
 * @param {string} line
 */
function parsePorcelainPath(line) {
  const body = line.slice(3);
  if (body.includes(" -> ")) {
    return body.split(" -> ").pop().trim();
  }
  return body.trim().replace(/^"+|"+$/g, "");
}

/**
 * @param {string} workspaceRoot
 */
async function getGitStatus(workspaceRoot) {
  const root = workspaceRoot && String(workspaceRoot).trim();
  if (!root || !fs.existsSync(root)) {
    return { ok: false, isRepo: false, message: "No workspace" };
  }

  const check = await run(root, ["rev-parse", "--is-inside-work-tree"]);
  if (!check.ok || !/true/i.test(check.stdout.trim())) {
    return { ok: true, isRepo: false, message: "Not a git repo" };
  }

  const [branchRes, statusRes, upstreamRes, shortRes, subjectRes, remoteRes] =
    await Promise.all([
      run(root, ["rev-parse", "--abbrev-ref", "HEAD"]),
      run(root, ["status", "--porcelain", "-b"]),
      run(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]),
      run(root, ["rev-parse", "--short", "HEAD"]),
      run(root, ["log", "-1", "--pretty=%s"]),
      run(root, ["remote", "get-url", "origin"]),
    ]);

  const branch = branchRes.stdout.trim() || "HEAD";
  const shortHash = shortRes.ok ? shortRes.stdout.trim() : "";
  const headSubject = subjectRes.ok ? subjectRes.stdout.trim().slice(0, 80) : "";
  const remoteUrl = remoteRes.ok ? remoteRes.stdout.trim() : "";

  const lines = statusRes.stdout.split(/\r?\n/).filter(Boolean);
  let ahead = 0;
  let behind = 0;
  let dirty = 0;
  /** @type {string[]} */
  const dirtyFiles = [];
  for (const line of lines) {
    if (line.startsWith("##")) {
      const m = line.match(/\[ahead (\d+)(?:, behind (\d+))?\]|\[behind (\d+)\]/);
      if (m) {
        ahead = Number(m[1] || 0);
        behind = Number(m[2] || m[3] || 0);
      }
      continue;
    }
    dirty += 1;
    if (dirtyFiles.length < 12) {
      const p = parsePorcelainPath(line);
      if (p) dirtyFiles.push(p);
    }
  }

  // GitHub/GitLab "create PR" deep link when no open PR
  let createPrUrl = null;
  if (remoteUrl) {
    const https = remoteUrl
      .replace(/^git@([^:]+):/, "https://$1/")
      .replace(/\.git$/, "");
    if (/github\.com/i.test(https)) {
      createPrUrl = `${https}/compare/${encodeURIComponent(branch)}?expand=1`;
    } else if (/gitlab\.com/i.test(https)) {
      createPrUrl = `${https}/-/merge_requests/new?merge_request[source_branch]=${encodeURIComponent(branch)}`;
    }
  }

  return {
    ok: true,
    isRepo: true,
    branch,
    shortHash,
    headSubject,
    dirty,
    dirtyFiles,
    ahead,
    behind,
    upstream: upstreamRes.ok ? upstreamRes.stdout.trim() : "",
    remoteUrl,
    createPrUrl,
    root: path.resolve(root),
  };
}

async function getPullRequest(workspaceRoot) {
  const root = workspaceRoot && String(workspaceRoot).trim();
  if (!root) return null;
  return new Promise((resolve) => {
    execFile(
      "gh",
      ["pr", "view", "--json", "number,url,title,state"],
      { cwd: root, timeout: 6000, windowsHide: true },
      (err, stdout) => {
        if (err) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(String(stdout || "{}")));
        } catch {
          resolve(null);
        }
      },
    );
  });
}

/**
 * Create a PR via `gh pr create` (optional; needs gh + network).
 * @param {string} workspaceRoot
 * @param {{ title?: string, body?: string, draft?: boolean }} [opts]
 */
async function createPullRequest(workspaceRoot, opts = {}) {
  const root = workspaceRoot && String(workspaceRoot).trim();
  if (!root || !fs.existsSync(root)) {
    return { ok: false, message: "No workspace" };
  }
  const title = String(opts.title || "Updates").slice(0, 200);
  const body = String(opts.body || "").slice(0, 4000);
  const args = ["pr", "create", "--title", title, "--body", body || "Created from Grok Build"];
  if (opts.draft) args.push("--draft");
  return new Promise((resolve) => {
    execFile(
      "gh",
      args,
      { cwd: root, timeout: 60_000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const out = String(stdout || "").trim();
        const errText = String(stderr || "").trim();
        if (err) {
          resolve({
            ok: false,
            message: errText || err.message || "gh pr create failed",
            stdout: out,
          });
          return;
        }
        const urlMatch = out.match(/https?:\/\/\S+/);
        resolve({
          ok: true,
          url: urlMatch ? urlMatch[0] : out,
          stdout: out,
        });
      },
    );
  });
}

module.exports = { getGitStatus, getPullRequest, createPullRequest, parsePorcelainPath };
