/**
 * Phase B1 — multi-session tabs (UI + snapshot).
 * One ACP process; each tab holds independent timeline snapshot + session id.
 */
(() => {
  let seq = 1;

  /**
   * @param {{
   *   root: HTMLElement,
   *   onActivate: (tab: object, prev: object|null) => void,
   *   onClose?: (tab: object) => void,
   *   onNew?: () => void,
   * }} opts
   */
  function createSessionTabs(opts) {
    const root = opts.root;
    /** @type {Array<{ id: string, title: string, sessionId: string|null, cwd: string|null, items: any[], busy: boolean }>} */
    let tabs = [];
    let activeId = null;

    function makeTab(partial) {
      return {
        id: `tab-${seq++}`,
        title: partial?.title || "Chat",
        sessionId: partial?.sessionId || null,
        cwd: partial?.cwd || null,
        items: partial?.items || [],
        busy: false,
        deferLoad: Boolean(partial?.deferLoad),
        skipPrevSnapshot: Boolean(partial?.skipPrevSnapshot),
      };
    }

    function render() {
      root.innerHTML = "";
      root.classList.add("session-tabs");
      // One conversation lives under the sidebar project. Hide the rail until
      // the user explicitly keeps two chats open at once.
      if (tabs.length <= 1) {
        root.classList.add("session-tabs-empty");
        return;
      }
      root.classList.remove("session-tabs-empty");
      const rail = document.createElement("div");
      rail.className = "session-tabs-rail";
      for (const t of tabs) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "session-tab" + (t.id === activeId ? " active" : "");
        btn.dataset.tabId = t.id;
        btn.title = t.title || "Chat";
        const label = document.createElement("span");
        label.className = "session-tab-label";
        label.textContent = t.title + (t.busy ? " ·" : "");
        btn.appendChild(label);
        const x = document.createElement("span");
        x.className = "session-tab-x";
        x.textContent = "×";
        x.title = "Close tab";
        x.onclick = (ev) => {
          ev.stopPropagation();
          closeTab(t.id);
        };
        btn.appendChild(x);
        btn.onclick = () => activate(t.id);
        rail.appendChild(btn);
      }
      const add = document.createElement("button");
      add.type = "button";
      add.className = "session-tab-add";
      add.title = "New chat tab";
      add.setAttribute("aria-label", "New chat tab");
      add.textContent = "+";
      add.onclick = () => {
        if (opts.onNew) opts.onNew();
        else addTab({});
      };
      rail.appendChild(add);
      root.appendChild(rail);
    }

    function getActive() {
      return tabs.find((t) => t.id === activeId) || null;
    }

    function snapshotItems(items) {
      return (items || []).map((it) => ({
        kind: it.kind,
        text: it.text,
        meta: it.meta ? { ...it.meta } : {},
        streaming: false,
      }));
    }

    function activate(id) {
      if (id === activeId) return;
      const prev = getActive();
      const next = tabs.find((t) => t.id === id);
      if (!next) return;
      activeId = id;
      render();
      opts.onActivate(next, prev);
    }

    function addTab(partial, activateNow = true) {
      const t = makeTab(partial);
      tabs.push(t);
      if (activateNow) {
        const prev = getActive();
        activeId = t.id;
        render();
        opts.onActivate(t, prev);
      } else {
        render();
      }
      return t;
    }

    function closeTab(id) {
      if (tabs.length <= 1) return;
      const idx = tabs.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const [removed] = tabs.splice(idx, 1);
      opts.onClose?.(removed);
      if (activeId === id) {
        const next = tabs[Math.max(0, idx - 1)];
        activeId = next.id;
        render();
        opts.onActivate(next, removed);
      } else {
        render();
      }
    }

    function updateActive(patch) {
      const t = getActive();
      if (!t) return;
      Object.assign(t, patch);
      render();
    }

    function updateSession(sessionId, patch) {
      let changed = false;
      for (const tab of tabs) {
        if (tab.sessionId !== sessionId) continue;
        Object.assign(tab, patch);
        changed = true;
      }
      if (changed) render();
      return changed;
    }

    function setBusy(id, busy) {
      const t = tabs.find((x) => x.id === id);
      if (t) {
        t.busy = Boolean(busy);
        render();
      }
    }

    function saveSnapshot(items) {
      const t = getActive();
      if (t) t.items = snapshotItems(items);
    }

    function ensureOne() {
      if (!tabs.length) {
        const t = makeTab({ title: "Chat" });
        tabs = [t];
        activeId = t.id;
        render();
      }
    }

    function resetToOne(partial) {
      const t = makeTab(partial);
      tabs = [t];
      activeId = t.id;
      render();
      return t;
    }

    function pruneToActive() {
      const cur = getActive();
      if (!cur) {
        ensureOne();
        return getActive();
      }
      tabs = [cur];
      activeId = cur.id;
      render();
      return cur;
    }

    ensureOne();

    return {
      get tabs() {
        return tabs;
      },
      get activeId() {
        return activeId;
      },
      getActive,
      addTab,
      resetToOne,
      pruneToActive,
      closeTab,
      activate,
      updateActive,
      updateSession,
      setBusy,
      saveSnapshot,
      snapshotItems,
      render,
    };
  }

  globalThis.GrokSessionTabs = { create: createSessionTabs };
})();
