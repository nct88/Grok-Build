/**
 * Read Grok CLI marketplace cache under ~/.grok/marketplace-cache.
 * Complements `grok plugin marketplace list --json` (sources only).
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function stripBom(text) {
  const s = String(text ?? "");
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function grokHome() {
  return process.env.GROK_HOME || path.join(os.homedir(), ".grok");
}

function findMarketplaceJson(dir, depth = 0) {
  if (depth > 5 || !dir || !fs.existsSync(dir)) return null;
  const candidates = [
    path.join(dir, ".grok-plugin", "marketplace.json"),
    path.join(dir, ".claude-plugin", "marketplace.json"),
    path.join(dir, "marketplace.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (e.name === "node_modules" || e.name === ".git") continue;
      if (e.name.startsWith(".") && e.name !== ".grok-plugin" && e.name !== ".claude-plugin") {
        continue;
      }
      const found = findMarketplaceJson(path.join(dir, e.name), depth + 1);
      if (found) return found;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Build install SOURCE for `grok plugin install`.
 * Prefer local cache path; fall back to git URL (#subdir @ref).
 * @param {object} plugin
 * @param {string} cacheRoot
 */
function resolveInstallSource(plugin, cacheRoot) {
  const name = plugin?.name || "";
  const s = plugin?.source || {};
  const locals = [];
  if (s.path) locals.push(path.join(cacheRoot, String(s.path).replace(/^[/\\]+/, "")));
  if (name) {
    locals.push(path.join(cacheRoot, "plugins", name));
    locals.push(path.join(cacheRoot, "external_plugins", name));
  }
  for (const p of locals) {
    try {
      if (p && fs.existsSync(p)) return { source: path.resolve(p), kind: "local" };
    } catch {
      // ignore
    }
  }
  if (s.url) {
    let src = String(s.url);
    if (s.path) {
      const sub = String(s.path).replace(/^[/\\]+/, "");
      // CLI: supports #subdir and @ref
      if (!src.includes("#")) src = `${src.replace(/\.git$/, "")}#${sub}`;
    }
    if (s.ref && !/@[\w./-]+$/.test(src.split("#").pop() || "")) {
      src = `${src}@${s.ref}`;
    }
    return { source: src, kind: "remote" };
  }
  return name ? { source: name, kind: "name" } : null;
}

/**
 * @returns {{
 *   ok: boolean,
 *   grokHome: string,
 *   cacheDir: string,
 *   marketplaces: Array<{
 *     id: string,
 *     name: string,
 *     description: string,
 *     cacheDir: string,
 *     pluginCount: number,
 *     plugins: Array<object>,
 *   }>,
 *   plugins: Array<object>,
 * }}
 */
function loadMarketplaceCatalog() {
  const home = grokHome();
  const cacheDir = path.join(home, "marketplace-cache");
  /** @type {any[]} */
  const marketplaces = [];
  /** @type {any[]} */
  const plugins = [];

  if (!fs.existsSync(cacheDir)) {
    return {
      ok: true,
      grokHome: home,
      cacheDir,
      marketplaces: [],
      plugins: [],
      message: "No marketplace cache yet. Run: grok plugin marketplace update",
    };
  }

  let dirs = [];
  try {
    dirs = fs.readdirSync(cacheDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    dirs = [];
  }

  for (const d of dirs) {
    const root = path.join(cacheDir, d.name);
    const mj = findMarketplaceJson(root);
    if (!mj) continue;
    let raw = "";
    try {
      raw = stripBom(fs.readFileSync(mj, "utf8"));
    } catch {
      continue;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      // Claude marketplace.json can be huge; skip broken
      continue;
    }
    const list = Array.isArray(data.plugins) ? data.plugins : [];
    const mktName = data.name || d.name;
    const mktDesc = data.description || "";
    const entry = {
      id: d.name,
      name: mktName,
      description: mktDesc,
      cacheDir: root,
      manifestPath: mj,
      pluginCount: list.length,
      plugins: [],
    };
    for (const p of list) {
      if (!p || !p.name) continue;
      const install = resolveInstallSource(p, root);
      const row = {
        name: String(p.name),
        description: String(p.description || "").slice(0, 400),
        category: p.category || "",
        author: p.author?.name || p.author || "",
        homepage: p.homepage || "",
        marketplace: mktName,
        marketplaceId: d.name,
        installSource: install?.source || p.name,
        installKind: install?.kind || "name",
      };
      entry.plugins.push(row);
      plugins.push(row);
    }
    // Don't embed full plugin arrays twice in IPC if huge — keep summary on marketplace
    entry.pluginCount = entry.plugins.length;
    marketplaces.push(entry);
  }

  // Sort: xAI first, then by name
  marketplaces.sort((a, b) => {
    const ax = /xai/i.test(a.name) ? 0 : 1;
    const bx = /xai/i.test(b.name) ? 0 : 1;
    if (ax !== bx) return ax - bx;
    return String(a.name).localeCompare(String(b.name));
  });
  plugins.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return {
    ok: true,
    grokHome: home,
    cacheDir,
    marketplaces: marketplaces.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      cacheDir: m.cacheDir,
      pluginCount: m.pluginCount,
    })),
    // Cap payload — UI filters client-side on this list
    plugins: plugins.slice(0, 2000),
    totalPlugins: plugins.length,
  };
}

module.exports = {
  loadMarketplaceCatalog,
  resolveInstallSource,
  grokHome,
};
