import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const pkg = JSON.parse(read("package.json"));
const desktop = JSON.parse(read("apps/desktop/package.json"));
const version = read("product/VERSION").trim();
const packaging = JSON.parse(read("packaging.json"));
const publisher = read("scripts/publish-release.ps1");
const license = read("LICENSE");
const readme = read("README.md");

const failures = [];
if (pkg.version !== version || desktop.version !== version) {
  failures.push(`version mismatch: root=${pkg.version}, desktop=${desktop.version}, product=${version}`);
}
if (!read("docs/COMPLETE.md").includes(version)) failures.push(`docs/COMPLETE.md missing ${version}`);
if (packaging.versionSource !== "product/VERSION") failures.push("packaging.json must use product/VERSION");
if (packaging.immutableVersions !== true) failures.push("packaging.json must declare immutableVersions");
if (packaging.license !== "LICENSE") failures.push("packaging.json must identify LICENSE");
if (!/All rights reserved/i.test(license)) failures.push("LICENSE must state the distribution rights");
if (/TODO:\s*add LICENSE/i.test(readme)) failures.push("README still contains the license release blocker");
if (!/No open-source license is granted/i.test(readme)) failures.push("README must not imply an open-source grant");
if (/H:\\projects/i.test(publisher)) failures.push("publisher contains a fixed H:\\projects path");
if (/Retention:\s*remove|Invoke-Retention/i.test(publisher)) failures.push("publisher must not prune old releases");
if (/path\s*=\s*\$i\.FullName/.test(publisher)) failures.push("manifest must not expose absolute artifact paths");
if (!/Release .*already exists/.test(publisher)) failures.push("publisher must reject an existing version");
if (!/NSIS installer was not produced/.test(publisher)) failures.push("publisher must fail when installer is missing");
if (!/PublicRelease requires an HTTPS/.test(publisher)) failures.push("public release must require HTTPS");
if (!/Get-AuthenticodeSignature/.test(publisher)) failures.push("public release must verify signatures");

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Release contract OK (${version}): immutable artifacts, complete channels, portable manifest paths.`);
