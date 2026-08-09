/**
 * P2 — agent slot strip UI (AgentSupervisor).
 * Only visible when there is more than one agent process (not a second "Chat" tab row).
 * globalThis.GrokAgentSlotsUi
 */
(() => {
  /**
   * @param {HTMLElement} root
   * @param {{
   *   slots: object[],
   *   activeId: string,
   *   maxSlots: number,
   *   onSelect: (id: string) => void,
   *   onSpawn: () => void,
   *   onStop: (id: string) => void,
   *   labels?: { primary?: string, parallel?: string, stop?: string },
   * }} opts
   */
  function render(root, opts) {
    if (!root) return;
    const slots = opts.slots || [];
    // Never look like a second session-tab strip when only primary exists
    if (slots.length <= 1) {
      root.classList.add("hidden");
      root.innerHTML = "";
      return;
    }
    root.classList.remove("hidden");
    root.innerHTML = "";
    const rail = document.createElement("div");
    rail.className = "agent-slots-rail";
    const primaryLabel = opts.labels?.primary || "Primary agent";
    for (const s of slots) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "agent-slot-chip" +
        (s.id === opts.activeId ? " active" : "") +
        (s.warm ? " warm" : "");
      const label =
        s.label && s.label !== "Chat"
          ? s.label
          : s.id === "primary"
            ? primaryLabel
            : s.label || "Parallel agent";
      const st = s.state || "disconnected";
      btn.title = `${label} · ${st}${s.sessionId ? ` · ${String(s.sessionId).slice(0, 8)}` : ""}`;
      btn.innerHTML = `<span class="agent-slot-dot" data-s="${st}"></span><span class="agent-slot-label"></span>`;
      btn.querySelector(".agent-slot-label").textContent = label;
      btn.onclick = () => opts.onSelect?.(s.id);
      rail.appendChild(btn);
      if (s.id !== "primary" && (s.warm || s.state === "connected" || s.state === "running")) {
        const x = document.createElement("button");
        x.type = "button";
        x.className = "agent-slot-stop";
        x.title = opts.labels?.stop || "Stop parallel agent";
        x.textContent = "×";
        x.onclick = (e) => {
          e.stopPropagation();
          opts.onStop?.(s.id);
        };
        rail.appendChild(x);
      }
    }
    if (slots.length < (opts.maxSlots || 2)) {
      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "agent-slot-chip add";
      plus.title = opts.labels?.parallel || "Parallel agent";
      plus.textContent = "+";
      plus.onclick = () => opts.onSpawn?.();
      rail.appendChild(plus);
    }
    root.appendChild(rail);
  }

  globalThis.GrokAgentSlotsUi = { render };
})();
