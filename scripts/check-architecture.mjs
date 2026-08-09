/**
 * Phase D1 — architecture guardrails.
 * Fails if desktop shell grows an agent loop or forbidden patterns.
 *
 * Run: node scripts/check-architecture.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const desktopSrc = path.join(root, "apps", "desktop", "src");
const renderer = path.join(root, "apps", "desktop", "renderer");

/** @type {{ file: string, pattern: RegExp, message: string, allow?: RegExp }[]} */
const rules = [
  {
    file: "apps/desktop/renderer/app.js",
    pattern: /fetch\s*\(\s*['"`]https?:\/\/api\.x\.ai/i,
    message: "Renderer must not call model APIs directly (use CLI/ACP)",
  },
  {
    file: "apps/desktop/renderer/app.js",
    pattern: /openai\.com\/v1|anthropic\.com\/v1/i,
    message: "Renderer must not hardcode third-party model HTTP endpoints",
  },
  {
    file: "apps/desktop/src/main.cjs",
    pattern: /async\s+function\s+runAgentLoop|function\s+agentLoop\b/,
    message: "Do not re-implement agent loop in Electron main",
  },
  {
    file: "apps/desktop/package.json",
    pattern: /"signAndEditExecutable"\s*:\s*true/,
    message: "Windows: keep signAndEditExecutable false (use afterPack rcedit stamp)",
  },
  {
    file: "apps/desktop/package.json",
    pattern: /"afterPack"\s*:\s*"build\/stamp-win-icon\.cjs"/,
    message: "afterPack stamp-win-icon.cjs must remain configured",
    // this is a required presence check inverted — handled separately
  },
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function walkJs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walkJs(p, acc);
    } else if (/\.(cjs|js|mjs|ts)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

let failed = 0;
const errors = [];

// Presence checks
const pkg = read("apps/desktop/package.json");
if (!/"signAndEditExecutable"\s*:\s*false/.test(pkg)) {
  failed++;
  errors.push("D5: package.json must set win.signAndEditExecutable: false");
}
if (!/"afterPack"\s*:\s*"build\/stamp-win-icon\.cjs"/.test(pkg)) {
  failed++;
  errors.push("D5: package.json must set afterPack to build/stamp-win-icon.cjs");
}
if (!fs.existsSync(path.join(root, "apps/desktop/build/stamp-win-icon.cjs"))) {
  failed++;
  errors.push("D5: missing apps/desktop/build/stamp-win-icon.cjs");
}
if (!fs.existsSync(path.join(root, "apps/desktop/build/icon.ico"))) {
  failed++;
  errors.push("D5: missing apps/desktop/build/icon.ico");
}

// Negative pattern rules
for (const rule of rules) {
  if (rule.message.includes("must remain configured")) continue;
  try {
    const text = read(rule.file);
    if (rule.pattern.test(text)) {
      if (rule.allow && rule.allow.test(text)) continue;
      failed++;
      errors.push(`${rule.file}: ${rule.message}`);
    }
  } catch (e) {
    failed++;
    errors.push(`Cannot read ${rule.file}: ${e.message}`);
  }
}

// Scan renderer for spawn of grok agent loop
for (const file of walkJs(renderer)) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  if (rel.includes("/workers/")) continue;
  const text = fs.readFileSync(file, "utf8");
  if (/spawn\s*\([^)]*grok|child_process/.test(text) && !rel.includes("node_modules")) {
    failed++;
    errors.push(`${rel}: renderer must not spawn processes (main/preload only)`);
  }
}

// acp-client must remain the only GrokClient host path used by desktop
const main = read("apps/desktop/src/main.cjs");
const supervisor = fs.existsSync(path.join(root, "apps/desktop/src/agentSupervisor.cjs"))
  ? read("apps/desktop/src/agentSupervisor.cjs")
  : "";
if (!/GrokClient|loadAcp|acp-client|AgentSupervisor/.test(main)) {
  failed++;
  errors.push("main.cjs must load ACP client / GrokClient / AgentSupervisor");
}
if (/class\s+GrokClient\b/.test(main) || /class\s+GrokClient\b/.test(supervisor)) {
  failed++;
  errors.push("Do not define GrokClient inside desktop — use packages/acp-client");
}
// P1 modules present
for (const rel of [
  "apps/desktop/src/launchArgs.cjs",
  "apps/desktop/src/productPaths.cjs",
  "apps/desktop/src/agentSupervisor.cjs",
  "apps/desktop/src/ipcContract.cjs",
]) {
  if (!fs.existsSync(path.join(root, rel))) {
    failed++;
    errors.push(`Missing P1 module: ${rel}`);
  }
}
// IPC contract: preload must cover invoke channels
try {
  const { validatePreloadContract } = require(
    path.join(root, "apps/desktop/src/ipcContract.cjs"),
  );
  const preload = read("apps/desktop/src/preload.cjs");
  const v = validatePreloadContract(preload);
  if (!v.ok) {
    failed++;
    if (v.missing.length) {
      errors.push(`preload missing invoke channels: ${v.missing.join(", ")}`);
    }
    if (v.missingEvents.length) {
      errors.push(`preload missing event channels: ${v.missingEvents.join(", ")}`);
    }
  }
} catch (e) {
  failed++;
  errors.push(`IPC contract check failed: ${e.message}`);
}

// Summary
if (failed) {
  console.error(`Architecture check FAILED (${failed}):`);
  for (const e of errors) console.error("  ✗", e);
  process.exit(1);
}
console.log("Architecture check OK");
console.log("  · CLI/ACP owns agent loop");
console.log("  · Renderer is surface-only");
console.log("  · Windows icon stamp pattern intact");
process.exit(0);
