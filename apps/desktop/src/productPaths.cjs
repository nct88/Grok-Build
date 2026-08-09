/**
 * Product install layout (Windows defaults).
 * Keep in sync with docs/INSTALL_PATHS.md and product/PRODUCT_IDENTITY.md.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");

function createProductPaths(homedir = os.homedir()) {
  return {
    desktop: {
      productName: "Grok Build",
      installDir: path.join(homedir, "AppData", "Local", "Programs", "Grok Build"),
      exeNames: ["Grok Build.exe", "GrokBuild.exe"],
    },
    ide: {
      productName: "Grok Build IDE",
      installDir: path.join(homedir, "AppData", "Local", "Programs", "Grok Build IDE"),
      exeNames: ["Grok Build IDE.exe", "GrokBuildIDE.exe", "Code.exe", "code.exe"],
      downloadUrl: "https://github.com/",
    },
  };
}

const PRODUCT_PATHS = createProductPaths();

function isExecutableFile(p) {
  if (!p || !fs.existsSync(p)) return false;
  try {
    return fs.statSync(p).isFile() && /\.(exe|cmd|bat|app)$/i.test(p);
  } catch {
    return false;
  }
}

/** Resolve .exe under a folder (or return path if already an exe). */
function resolveExeInDir(dirOrExe, exeNames) {
  if (!dirOrExe) return null;
  try {
    if (isExecutableFile(dirOrExe)) return path.resolve(dirOrExe);
    if (!fs.existsSync(dirOrExe) || !fs.statSync(dirOrExe).isDirectory()) return null;
    for (const name of exeNames || []) {
      const candidate = path.join(dirOrExe, name);
      if (isExecutableFile(candidate)) return candidate;
    }
    const files = fs.readdirSync(dirOrExe);
    for (const f of files) {
      if (/grok.*ide|ide.*grok|code\.exe/i.test(f) && /\.exe$/i.test(f)) {
        const full = path.join(dirOrExe, f);
        if (isExecutableFile(full)) return full;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * @param {{
 *   loadState: () => object,
 *   productPaths?: ReturnType<typeof createProductPaths>,
 * }} deps
 */
function resolveIdeInstall(deps) {
  const PRODUCT = deps.productPaths || PRODUCT_PATHS;
  const state = deps.loadState() || {};
  const downloadUrl =
    (typeof state.ideDownloadUrl === "string" && state.ideDownloadUrl.trim()) ||
    PRODUCT.ide.downloadUrl;
  const productName = PRODUCT.ide.productName;
  const exeNames = PRODUCT.ide.exeNames;
  const home = os.homedir();

  const candidates = [
    { src: "settings", path: state.idePath },
    { src: "env", path: process.env.GROK_BUILD_IDE },
    { src: "default", path: PRODUCT.ide.installDir },
    {
      src: "default-alt",
      path: path.join(home, "AppData", "Local", "Programs", "grok-build-ide"),
    },
    { src: "program-files", path: "C:\\Program Files\\Grok Build IDE" },
    { src: "dev", path: "H:\\projects\\grok-build-ide" },
    { src: "dev-e", path: "E:\\projects\\grok-build-ide" },
  ].filter((c) => c.path && String(c.path).trim());

  for (const c of candidates) {
    const exe = resolveExeInDir(String(c.path).trim(), exeNames);
    if (exe) {
      return {
        installed: true,
        installDir: path.dirname(exe),
        executable: exe,
        source: c.src,
        productName,
        downloadUrl,
      };
    }
  }
  return {
    installed: false,
    installDir: PRODUCT.ide.installDir,
    executable: null,
    source: null,
    productName,
    downloadUrl,
  };
}

/**
 * Launch IDE app (not open folder). Phase C4: deep-link file:line:col.
 * @param {object} opts
 * @param {{
 *   loadState: () => object,
 *   getWorkspace?: () => string|null,
 *   getAllowOutside?: () => boolean,
 *   assertWorkspacePath?: (p: string, ctx: object) => string,
 *   grokHome?: () => string,
 *   productPaths?: ReturnType<typeof createProductPaths>,
 * }} deps
 */
async function openIdeApp(opts, deps) {
  /** @type {{ workspace?: string, file?: string, line?: number, column?: number }} */
  let options = {};
  if (typeof opts === "string") options = { workspace: opts };
  else if (opts && typeof opts === "object") options = opts;

  const ide = resolveIdeInstall(deps);
  if (!ide.installed || !ide.executable) {
    return {
      ok: false,
      reason: "not_installed",
      productName: ide.productName,
      expectedDir: ide.installDir,
      downloadUrl: ide.downloadUrl,
      message: `${ide.productName} is not installed.`,
    };
  }
  const workspace =
    (options.workspace && String(options.workspace).trim()) ||
    (deps.getWorkspace && deps.getWorkspace()) ||
    deps.loadState().workspaceRoot ||
    "";
  let file = "";
  if (options.file && typeof deps.assertWorkspacePath === "function") {
    try {
      file = deps.assertWorkspacePath(String(options.file), {
        workspaceRoot: workspace || deps.loadState().workspaceRoot,
        allowOutside: Boolean(
          deps.getAllowOutside ? deps.getAllowOutside() : deps.loadState().allowOutside,
        ),
        grokHome: deps.grokHome ? deps.grokHome() : undefined,
      });
    } catch {
      file = "";
    }
  } else if (options.file) {
    file = String(options.file);
  }
  const line = Number(options.line) || 0;
  const column = Number(options.column) || 0;

  const args = [];
  if (workspace && fs.existsSync(workspace)) {
    args.push(workspace);
  }
  if (file && fs.existsSync(file)) {
    if (line > 0) {
      const goto = column > 0 ? `${file}:${line}:${column}` : `${file}:${line}`;
      args.push("-g", goto);
    } else {
      args.push(file);
    }
  }

  try {
    const child = spawn(ide.executable, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
      shell: false,
    });
    child.unref();
    return {
      ok: true,
      path: ide.executable,
      installDir: ide.installDir,
      source: ide.source,
      productName: ide.productName,
      workspace: workspace || null,
      file: file || null,
      line: line || null,
      args,
    };
  } catch (e) {
    return {
      ok: false,
      reason: "launch_failed",
      path: ide.executable,
      productName: ide.productName,
      message: e instanceof Error ? e.message : String(e),
      downloadUrl: ide.downloadUrl,
    };
  }
}

module.exports = {
  PRODUCT_PATHS,
  createProductPaths,
  isExecutableFile,
  resolveExeInDir,
  resolveIdeInstall,
  openIdeApp,
};
