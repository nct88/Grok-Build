/**
 * Launch desktop via stamped GrokBuild-dev.exe (Windows) so the taskbar
 * shows the Grok icon. Falls back to `electron` from PATH/package.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const desktopRoot = path.resolve(__dirname, "..");
const pathFile = path.join(__dirname, "dev-electron-path.txt");

function resolveHost() {
  if (process.platform === "win32" && fs.existsSync(pathFile)) {
    const p = fs.readFileSync(pathFile, "utf8").trim();
    if (p && fs.existsSync(p)) return p;
  }
  // Fallback: require('electron') path string
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const electronPath = require("electron");
    if (typeof electronPath === "string" && fs.existsSync(electronPath)) {
      return electronPath;
    }
  } catch {
    // ignore
  }
  return "electron";
}

const host = resolveHost();
const child = spawn(host, ["."], {
  cwd: desktopRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    // Stable AUMID so Windows groups under Grok Build, not generic Electron
    ELECTRON_FORCE_IS_PACKAGED: process.env.ELECTRON_FORCE_IS_PACKAGED || "",
  },
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});
