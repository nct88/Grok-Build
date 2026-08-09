/**
 * Phase C2 — durable artifacts (plans, summaries, job outputs, notes).
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

class ArtifactStore {
  /** @param {string} stateDir */
  constructor(stateDir) {
    this.file = path.join(stateDir, "artifacts.json");
    /** @type {object[]} */
    this.items = [];
    this._load();
  }

  _load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.file, "utf8"));
      this.items = Array.isArray(raw.items) ? raw.items : [];
    } catch {
      this.items = [];
    }
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(
        this.file,
        JSON.stringify({ items: this.items.slice(0, 200) }, null, 2),
        "utf8",
      );
    } catch {
      // ignore
    }
  }

  list(limit = 60) {
    return this.items.slice(0, limit);
  }

  /**
   * @param {{ type: string, title: string, content?: string, path?: string, meta?: object }} input
   */
  add(input) {
    const item = {
      id: randomUUID(),
      type: String(input.type || "note"),
      title: String(input.title || "Artifact").slice(0, 120),
      content: input.content != null ? String(input.content).slice(0, 50_000) : "",
      path: input.path || "",
      meta: input.meta || {},
      createdAt: new Date().toISOString(),
    };
    this.items.unshift(item);
    if (this.items.length > 200) this.items.length = 200;
    this._save();
    return item;
  }

  remove(id) {
    const before = this.items.length;
    this.items = this.items.filter((x) => x.id !== id);
    if (this.items.length !== before) this._save();
    return this.items.length !== before;
  }

  clear() {
    this.items = [];
    this._save();
  }
}

module.exports = { ArtifactStore };
