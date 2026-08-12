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
const githubPublisher = read("scripts/publish-github-release.ps1");
const releaseNotes = read(`docs/releases/${version}.md`);
const releaseTemplate = read("docs/releases/TEMPLATE.md");
const license = read("LICENSE");
const readme = read("README.md");
const readmeEn = read("README.en.md");

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
if (!pkg.scripts?.["release:github"]?.includes("publish-github-release.ps1")) {
  failures.push("package scripts must expose the guarded GitHub release publisher");
}
if (!/status.*--porcelain/s.test(githubPublisher)) failures.push("GitHub publisher must require a clean worktree");
if (!/origin\/\$branch/.test(githubPublisher)) failures.push("GitHub publisher must compare HEAD with the remote branch");
if (!/Assert-Hash/.test(githubPublisher)) failures.push("GitHub publisher must verify manifest hashes");
if (!/require\('\.\/package-lock\.json'\)\.version/.test(githubPublisher)) {
  failures.push("GitHub publisher must read package-lock through Node for Windows PowerShell 5 compatibility");
}
if (!/Get-AuthenticodeSignature/.test(githubPublisher)) failures.push("GitHub publisher must inspect executable signatures");
if (!/AllowUnsigned/.test(githubPublisher)) failures.push("GitHub publisher must require an explicit unsigned override");
if (!/release.*create.*\$tag/s.test(githubPublisher)) failures.push("GitHub publisher must create a tagged release");
if (!/--verify-tag/.test(githubPublisher)) failures.push("GitHub publisher must verify the pushed tag");
if (!/existingReleaseExitCode/.test(githubPublisher) || !/localTagExitCode/.test(githubPublisher)) {
  failures.push("GitHub publisher must treat absent release/tag probes as expected state on Windows PowerShell 5");
}
if (!/release:github/.test(readme)) failures.push("README must document the GitHub release workflow");
if (!/href=["']\.\/README\.en\.md["']/.test(readme)) {
  failures.push("Vietnamese README must link to README.en.md in its language switch");
}
if (!/href=["']\.\/README\.md["']/.test(readmeEn)) {
  failures.push("English README must link back to README.md in its language switch");
}
for (const [name, content] of [["Vietnamese README", readme], ["English README", readmeEn]]) {
  if (!content.includes(`**${version}**`)) failures.push(`${name} must display current version ${version}`);
  if (!content.includes(`/releases/tag/v${version}`)) failures.push(`${name} must link to release v${version}`);
}
const releaseAssetPattern = new RegExp(
  `https://github\\.com/nct88/Grok-Build/releases/download/v${version.replaceAll(".", "\\.")}/[^)\\s]+`,
  "g",
);
const releaseAssets = (content) => [...new Set(content.match(releaseAssetPattern) || [])].sort();
const viAssets = releaseAssets(readme);
const enAssets = releaseAssets(readmeEn);
if (viAssets.length !== 4) failures.push(`Vietnamese README must expose 4 release assets, found ${viAssets.length}`);
if (JSON.stringify(viAssets) !== JSON.stringify(enAssets)) {
  failures.push("Vietnamese and English README download links must match exactly");
}
const sectionCount = (content) => (content.match(/^##\s+/gm) || []).length;
if (sectionCount(readme) !== sectionCount(readmeEn)) {
  failures.push(`README section count mismatch: vi=${sectionCount(readme)}, en=${sectionCount(readmeEn)}`);
}
if (readmeEn.length < readme.length * 0.75) failures.push("English README appears incomplete");
for (const [name, content] of [["current release notes", releaseNotes], ["release template", releaseTemplate]]) {
  if (!/<!--\s*release:vi\s*-->/.test(content)) failures.push(`${name} must include the Vietnamese marker`);
  if (!/<!--\s*release:en\s*-->/.test(content)) failures.push(`${name} must include the English marker`);
  if (!/^\|\s*Tiếng Việt\s*\|\s*English\s*\|\s*$/m.test(content)) {
    failures.push(`${name} must present Vietnamese and English in a parallel table`);
  }
}
if (!/release:vi/.test(githubPublisher) || !/release:en/.test(githubPublisher)) {
  failures.push("GitHub publisher must enforce bilingual release-note markers");
}
if (!/scripts\/check-release-contract\.mjs/.test(githubPublisher)) {
  failures.push("GitHub publisher must run the README and release-content contract before publishing");
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Release contract OK (${version}): immutable artifacts, complete channels, bilingual README/release content.`);
