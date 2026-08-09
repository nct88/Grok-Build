/**
 * Phase D5 — packaging contract (Windows icon stamp).
 * Run: node scripts/check-packaging.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = path.join(root, "apps/desktop/package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const errors = [];

if (pkg.build?.win?.signAndEditExecutable !== false) {
  errors.push("win.signAndEditExecutable must be false (symlink privilege / winCodeSign)");
}
if (pkg.build?.afterPack !== "build/stamp-win-icon.cjs") {
  errors.push('afterPack must be "build/stamp-win-icon.cjs"');
}
const stamp = path.join(root, "apps/desktop/build/stamp-win-icon.cjs");
if (!fs.existsSync(stamp)) errors.push("missing stamp-win-icon.cjs");
else {
  const text = fs.readFileSync(stamp, "utf8");
  if (!text.includes("--set-icon")) errors.push("stamp script must call rcedit --set-icon");
  for (const marker of ["--set-file-version", "--set-product-version", '"ProductName", "Grok Build"', '"FileDescription", "Grok Build agent desktop"']) {
    if (!text.includes(marker)) errors.push(`stamp script missing metadata marker: ${marker}`);
  }
  if (/Setup|portable/i.test(text) && /afterAllArtifactBuild|artifactPaths/.test(text)) {
    errors.push("Do not rcedit NSIS/portable wrappers (destroys payload)");
  }
}
const ico = path.join(root, "apps/desktop/build/icon.ico");
if (!fs.existsSync(ico)) errors.push("missing build/icon.ico");
else {
  const size = fs.statSync(ico).size;
  if (size < 1000) errors.push(`icon.ico too small (${size} bytes)`);
}

// NSIS icons
const nsis = pkg.build?.nsis || {};
for (const k of ["installerIcon", "uninstallerIcon", "installerHeaderIcon"]) {
  if (nsis[k] !== "build/icon.ico") {
    errors.push(`nsis.${k} should be build/icon.ico`);
  }
}

if (errors.length) {
  console.error("Packaging check FAILED:");
  for (const e of errors) console.error("  ✗", e);
  process.exit(1);
}
console.log("Packaging check OK");
console.log("  · signAndEditExecutable: false");
console.log("  · afterPack: icon + Grok Build metadata (app exe only)");
console.log("  · icon.ico present");
console.log("  · NSIS installer icons configured");
process.exit(0);
