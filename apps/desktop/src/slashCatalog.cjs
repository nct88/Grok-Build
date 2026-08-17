"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const MAX_HINT_LENGTH = 96;

function stripBom(text) {
  const value = String(text ?? "");
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function pathInside(candidate, root) {
  if (!candidate || !root) return false;
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function skillSource(skill) {
  const source = skill?.source;
  if (source && typeof source === "object") {
    return {
      type: String(source.type || "").toLowerCase(),
      path: String(source.path || ""),
    };
  }
  const text = String(source || "");
  const type = text.match(/(?:^|[{@;\s])type=([^;}\s]+)/i)?.[1] || "";
  const sourcePath = text.match(/(?:^|[{@;\s])path=([^;}]+?)(?=;\s*\w+=|}$|$)/i)?.[1] || "";
  return { type: type.toLowerCase(), path: sourcePath.trim() };
}

function hintFromDescription(description) {
  const compact = String(description || "").replace(/\s+/g, " ").trim();
  if (!compact) return "Local Grok skill";
  const firstSentence = compact.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || compact;
  if (firstSentence.length <= MAX_HINT_LENGTH) return firstSentence;
  return `${firstSentence.slice(0, MAX_HINT_LENGTH - 1).trimEnd()}…`;
}

/** Keep only invocable skills stored in this workspace or GROK_HOME/skills. */
function normalizeInspectSkills(inspect, options = {}) {
  const workspaceRoot = options.workspaceRoot ? path.resolve(options.workspaceRoot) : "";
  const grokHome = options.grokHome ? path.resolve(options.grokHome) : "";
  const localRoots = [
    workspaceRoot && path.join(workspaceRoot, ".grok", "skills"),
    grokHome && path.join(grokHome, "skills"),
  ].filter(Boolean);
  const seen = new Set();
  const commands = [];

  for (const skill of Array.isArray(inspect?.skills) ? inspect.skills : []) {
    if (skill?.userInvocable !== true) continue;
    const id = String(skill.name || "").trim().toLowerCase();
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(id) || seen.has(id)) continue;
    const source = skillSource(skill);
    if (!source.path || !localRoots.some((root) => pathInside(source.path, root))) continue;
    seen.add(id);
    commands.push({
      id,
      label: `/${id}`,
      hint: hintFromDescription(skill.description),
      description: String(skill.description || "").replace(/\s+/g, " ").trim(),
      insert: `/${id} `,
      kind: "skill",
      source: source.type || "local",
    });
  }

  return commands.sort((a, b) => a.id.localeCompare(b.id));
}

function inspectGrok({ executable, cwd, environment, timeoutMs = 10_000 }) {
  return new Promise((resolve) => {
    execFile(
      executable,
      ["inspect", "--json"],
      {
        cwd,
        env: environment,
        timeout: timeoutMs,
        windowsHide: true,
        maxBuffer: 4 * 1024 * 1024,
      },
      (error, stdout) => {
        if (error) return resolve(null);
        try {
          resolve(JSON.parse(stripBom(stdout)));
        } catch {
          resolve(null);
        }
      },
    );
  });
}

async function loadLocalSlashCommands(options = {}) {
  const workspaceRoot = options.workspaceRoot ? path.resolve(options.workspaceRoot) : "";
  const grokHome = options.grokHome ? path.resolve(options.grokHome) : "";
  const cwd = workspaceRoot && fs.existsSync(workspaceRoot) ? workspaceRoot : options.cwd;
  if (!cwd || !fs.existsSync(cwd)) return [];
  const inspect = await inspectGrok({
    executable: options.executable,
    cwd,
    environment: options.environment,
    timeoutMs: options.timeoutMs,
  });
  return normalizeInspectSkills(inspect, { workspaceRoot, grokHome });
}

module.exports = {
  MAX_HINT_LENGTH,
  hintFromDescription,
  normalizeInspectSkills,
  inspectGrok,
  loadLocalSlashCommands,
  pathInside,
  skillSource,
};
