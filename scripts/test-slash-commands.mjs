import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { MAX_HINT_LENGTH, normalizeInspectSkills } = require(
  path.join(root, "apps", "desktop", "src", "slashCatalog.cjs"),
);

const workspaceRoot = path.join(root, "temp", "slash-fixture-project");
const grokHome = path.join(root, "temp", "slash-fixture-home", ".grok");
const localSkill = (name, description, sourcePath, extra = {}) => ({
  name,
  description,
  userInvocable: true,
  source: { type: "project", path: sourcePath },
  ...extra,
});

const inspect = {
  skills: [
    localSkill(
      "work-analysis",
      "Produce a claims-vs-code analysis report. This second sentence stays out of the compact hint.",
      path.join(workspaceRoot, ".grok", "skills", "work-analysis", "SKILL.md"),
    ),
    localSkill(
      "context-watch",
      "Detect when reasoning quality is dropping because the context window is filling and provide a deliberately long explanation that must be truncated before it can make the slash menu too dense.",
      path.join(grokHome, "skills", "context-watch", "SKILL.md"),
      { source: { type: "user", path: path.join(grokHome, "skills", "context-watch", "SKILL.md") } },
    ),
    localSkill(
      "external-skill",
      "Must not appear.",
      path.join(root, "outside", "SKILL.md"),
      { source: { type: "user", path: path.join(root, "outside", "SKILL.md") } },
    ),
    localSkill(
      "bundled-review",
      "Must not appear.",
      path.join(grokHome, "bundled", "skills", "review", "SKILL.md"),
      { source: { type: "bundled", path: path.join(grokHome, "bundled", "skills", "review", "SKILL.md") } },
    ),
    localSkill(
      "disabled-skill",
      "Must not appear.",
      path.join(workspaceRoot, ".grok", "skills", "disabled-skill", "SKILL.md"),
      { userInvocable: false },
    ),
  ],
};

const catalog = normalizeInspectSkills(inspect, { workspaceRoot, grokHome });
assert.deepEqual(catalog.map((command) => command.id), ["context-watch", "work-analysis"]);
assert.ok(catalog.every((command) => command.hint.length <= MAX_HINT_LENGTH));
assert.equal(catalog.find((command) => command.id === "work-analysis")?.hint, "Produce a claims-vs-code analysis report.");
assert.deepEqual(normalizeInspectSkills(null, { workspaceRoot, grokHome }), []);

const source = await readFile(
  path.join(root, "apps", "desktop", "renderer", "lib", "slashCommands.js"),
  "utf8",
);
const context = { globalThis: {} };
vm.createContext(context);
vm.runInContext(source, context);
const slash = context.globalThis.GrokSlashCommands;

assert.deepEqual(
  Array.from(slash.COMMANDS, (command) => command.id),
  ["imagine", "imagine-video", "usage", "settings", "marketplace", "plugins"],
);
slash.setRuntimeCommands(catalog);
assert.deepEqual(
  Array.from(slash.COMMANDS, (command) => command.id),
  [
    "imagine",
    "imagine-video",
    "usage",
    "settings",
    "marketplace",
    "plugins",
    "context-watch",
    "work-analysis",
  ],
);
assert.deepEqual(
  Array.from(slash.menuForInput("/work", 5).items, (command) => command.id),
  ["work-analysis"],
);
assert.equal(
  slash.resolveSlash("/work-analysis check release claims").text,
  "Use the work-analysis skill and follow it.\nUser request: check release claims",
);
assert.equal(slash.resolveSlash("/settings").kind, "ui");
assert.equal(slash.resolveSlash("/not-installed").kind, "passthrough");
slash.setRuntimeCommands([]);
assert.equal(slash.menuForInput("/work", 5), null);

console.log("Slash command catalog OK: local skill discovery, filtering, invocation, fallback.");
