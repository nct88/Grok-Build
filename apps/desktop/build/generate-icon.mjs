/**
 * Standard Grok Build icons from the black-left/white-right Fluffy master.
 *  - icon.png  (256×256 for electron-builder / About)
 *  - icon.ico  (16…256 multi-size for Windows exe, taskbar, shortcuts)
 *
 * On Windows, generates ICO via generate-icon.ps1 (System.Drawing).
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { platform } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");
const srcFluffy = join(root, "logo", "fluffy-grok-master.png");
const srcMain = join(root, "logo", "grok-main-logo.png");
const srcLegacy = join(root, "logo", "grok-app.png");
const src = existsSync(srcFluffy) ? srcFluffy : existsSync(srcMain) ? srcMain : srcLegacy;
const outPng = join(__dirname, "icon.png");
const outIco = join(__dirname, "icon.ico");
const note = join(__dirname, "ICON_SOURCE.txt");

mkdirSync(__dirname, { recursive: true });

if (!existsSync(src)) {
  console.error("Missing logo source:", srcFluffy, srcMain, "or", srcLegacy);
  process.exit(1);
}
console.log("Icon source:", src);

if (platform() === "win32") {
  const ps1 = join(__dirname, "generate-icon.ps1");
  const r = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1],
    { encoding: "utf8" },
  );
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    console.error("generate-icon.ps1 failed; falling back to PNG copy only");
    copyFileSync(src, outPng);
  }
} else {
  // Non-Windows: PNG only (mac uses icon.icns separately if needed)
  copyFileSync(src, outPng);
}

if (!existsSync(outPng)) copyFileSync(src, outPng);

const relSrc = src.includes("fluffy-grok-master")
  ? "logo/fluffy-grok-master.png"
  : src.includes("grok-main-logo")
    ? "logo/grok-main-logo.png"
    : "logo/grok-app.png";
writeFileSync(
  note,
  [
    "Grok Build desktop icons",
    `Source: ${relSrc}`,
    `PNG: apps/desktop/build/icon.png`,
    `ICO: apps/desktop/build/icon.ico (Windows exe / taskbar / Start menu)`,
    "Re-run: node apps/desktop/build/generate-icon.mjs",
    "",
  ].join("\n"),
  "utf8",
);

console.log("icon.png:", existsSync(outPng) ? outPng : "MISSING");
console.log("icon.ico:", existsSync(outIco) ? outIco : "MISSING (required on Windows)");
