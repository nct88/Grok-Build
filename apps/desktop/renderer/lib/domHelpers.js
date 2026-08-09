/**
 * Shared pure DOM/string helpers (P1 — reduce app.js duplication).
 * Loaded before app.js; attaches to globalThis.GrokDom.
 */
(() => {
  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function basen(p) {
    if (!p) return "";
    const s = String(p).replace(/[/\\]+$/, "");
    const i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\"));
    return i >= 0 ? s.slice(i + 1) : s;
  }

  function stripAnsi(input) {
    return String(input ?? "").replace(
      // eslint-disable-next-line no-control-regex
      /\u001b\[[0-9;]*[a-zA-Z]|\u001b\][^\u0007]*(?:\u0007|\u001b\\)|\u001b./g,
      "",
    );
  }

  globalThis.GrokDom = {
    escapeHtml,
    basen,
    stripAnsi,
  };
})();
