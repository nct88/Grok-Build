/**
 * Phase B4 — command palette (Ctrl/Cmd+K).
 */
(() => {
  /**
   * @param {{
   *   commands: Array<{ id: string, label: string, hint?: string, keywords?: string, run: () => void }>,
   * }} opts
   */
  function createCommandPalette(opts) {
    let open = false;
    let filter = "";
    let selected = 0;

    const overlay = document.createElement("div");
    overlay.className = "cmdk-overlay hidden";
    overlay.innerHTML = `
      <div class="cmdk-modal" role="dialog" aria-label="Command palette">
        <input class="cmdk-input" type="text" placeholder="Type a command…" autocomplete="off" spellcheck="false" />
        <div class="cmdk-list" role="listbox"></div>
        <div class="cmdk-foot"><kbd>↑↓</kbd> navigate · <kbd>↵</kbd> run · <kbd>esc</kbd> close</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector(".cmdk-input");
    const list = overlay.querySelector(".cmdk-list");

    function filtered() {
      const q = filter.trim().toLowerCase();
      const cmds = opts.commands || [];
      if (!q) return cmds;
      return cmds.filter((c) => {
        const hay = `${c.label} ${c.hint || ""} ${c.keywords || ""} ${c.id}`.toLowerCase();
        return hay.includes(q);
      });
    }

    function paint() {
      const rows = filtered();
      if (selected >= rows.length) selected = Math.max(0, rows.length - 1);
      list.innerHTML = "";
      if (!rows.length) {
        list.innerHTML = `<div class="cmdk-empty">No matches</div>`;
        return;
      }
      rows.forEach((c, i) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "cmdk-item" + (i === selected ? " active" : "");
        row.role = "option";
        row.innerHTML = `<span class="cmdk-label">${escape(c.label)}</span>${
          c.hint ? `<span class="cmdk-hint">${escape(c.hint)}</span>` : ""
        }`;
        row.onmouseenter = () => {
          selected = i;
          paint();
        };
        row.onclick = () => run(c);
        list.appendChild(row);
      });
      list.querySelector(".cmdk-item.active")?.scrollIntoView({ block: "nearest" });
    }

    function escape(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function run(c) {
      close();
      try {
        c.run();
      } catch {
        /* ignore */
      }
    }

    function show() {
      open = true;
      filter = "";
      selected = 0;
      overlay.classList.remove("hidden");
      input.value = "";
      paint();
      setTimeout(() => input.focus(), 0);
    }

    function close() {
      open = false;
      overlay.classList.add("hidden");
    }

    function toggle() {
      if (open) close();
      else show();
    }

    input.addEventListener("input", () => {
      filter = input.value;
      selected = 0;
      paint();
    });

    input.addEventListener("keydown", (e) => {
      const rows = filtered();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selected = Math.min(rows.length - 1, selected + 1);
        paint();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selected = Math.max(0, selected - 1);
        paint();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (rows[selected]) run(rows[selected]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    return {
      show,
      close,
      toggle,
      isOpen: () => open,
      setCommands(cmds) {
        opts.commands = cmds;
        if (open) paint();
      },
    };
  }

  globalThis.GrokCommandPalette = { create: createCommandPalette };
})();
