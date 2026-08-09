/**
 * Phase D4 — opt-in local performance telemetry.
 * Never phones home. Writes JSONL under userData when enabled.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const BUCKETS_MS = [50, 100, 250, 500, 1000, 2000, 5000, 15000, 60000];

class Telemetry {
  /**
   * @param {{ stateDir: string, loadEnabled: () => boolean, saveEnabled?: (v: boolean) => void }} opts
   */
  constructor(opts) {
    this.stateDir = opts.stateDir;
    this.loadEnabled = opts.loadEnabled;
    this.saveEnabled = opts.saveEnabled;
    this.file = path.join(opts.stateDir, "telemetry.jsonl");
    this.summaryFile = path.join(opts.stateDir, "telemetry-summary.json");
    /** @type {Record<string, number[]>} */
    this.samples = {
      connect_ms: [],
      first_token_ms: [],
      tool_roundtrip_ms: [],
      prompt_to_complete_ms: [],
      job_ms: [],
    };
    /** in-flight marks */
    this._marks = new Map();
    this._loadSummary();
  }

  get enabled() {
    try {
      return Boolean(this.loadEnabled());
    } catch {
      return false;
    }
  }

  setEnabled(on) {
    if (this.saveEnabled) this.saveEnabled(Boolean(on));
  }

  _loadSummary() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.summaryFile, "utf8"));
      if (raw && raw.samples) {
        for (const k of Object.keys(this.samples)) {
          if (Array.isArray(raw.samples[k])) {
            this.samples[k] = raw.samples[k].slice(-200);
          }
        }
      }
    } catch {
      // fresh
    }
  }

  _persistSummary() {
    try {
      fs.mkdirSync(this.stateDir, { recursive: true });
      fs.writeFileSync(
        this.summaryFile,
        JSON.stringify(
          {
            updatedAt: new Date().toISOString(),
            samples: this.samples,
            bucketsMs: BUCKETS_MS,
          },
          null,
          2,
        ),
        "utf8",
      );
    } catch {
      // ignore
    }
  }

  _appendLine(row) {
    try {
      fs.mkdirSync(this.stateDir, { recursive: true });
      fs.appendFileSync(this.file, JSON.stringify(row) + "\n", "utf8");
    } catch {
      // ignore
    }
  }

  /** Start a named timer. */
  mark(name, meta = {}) {
    if (!this.enabled) return;
    this._marks.set(name, { t0: Date.now(), meta });
  }

  /** End timer and record sample if name matches a known metric. */
  measure(name, metricKey, extra = {}) {
    if (!this.enabled) return null;
    const m = this._marks.get(name);
    this._marks.delete(name);
    if (!m) return null;
    const ms = Math.max(0, Date.now() - m.t0);
    const key = metricKey || name;
    if (this.samples[key]) {
      this.samples[key].push(ms);
      if (this.samples[key].length > 200) {
        this.samples[key] = this.samples[key].slice(-200);
      }
    }
    // Never persist free-form text that might include prompts/secrets
    const scrub = (obj) => {
      const out = {};
      for (const [k, v] of Object.entries(obj || {})) {
        if (/prompt|content|stdout|stderr|token|key|secret|password|auth/i.test(k)) continue;
        if (typeof v === "string" && v.length > 200) {
          out[k] = v.slice(0, 200);
        } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          out[k] = v;
        }
      }
      return out;
    };
    const row = {
      ts: new Date().toISOString(),
      metric: key,
      ms,
      ...scrub(m.meta),
      ...scrub(extra),
    };
    this._appendLine(row);
    this._persistSummary();
    return row;
  }

  /** Record a raw duration without mark. */
  record(metricKey, ms, extra = {}) {
    if (!this.enabled) return null;
    const v = Math.max(0, Number(ms) || 0);
    if (this.samples[metricKey]) {
      this.samples[metricKey].push(v);
      if (this.samples[metricKey].length > 200) {
        this.samples[metricKey] = this.samples[metricKey].slice(-200);
      }
    }
    const scrub = (obj) => {
      const out = {};
      for (const [k, val] of Object.entries(obj || {})) {
        if (/prompt|content|stdout|stderr|token|key|secret|password|auth/i.test(k)) continue;
        if (typeof val === "string" && val.length > 200) out[k] = val.slice(0, 200);
        else if (typeof val === "string" || typeof val === "number" || typeof val === "boolean")
          out[k] = val;
      }
      return out;
    };
    const row = {
      ts: new Date().toISOString(),
      metric: metricKey,
      ms: v,
      ...scrub(extra),
    };
    this._appendLine(row);
    this._persistSummary();
    return row;
  }

  clearMark(name) {
    this._marks.delete(name);
  }

  static percentile(arr, p) {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
    return s[idx];
  }

  static bucketize(arr) {
    const counts = BUCKETS_MS.map((b) => ({ le: b, n: 0 }));
    let over = 0;
    for (const v of arr) {
      let placed = false;
      for (const c of counts) {
        if (v <= c.le) {
          c.n += 1;
          placed = true;
          break;
        }
      }
      if (!placed) over += 1;
    }
    return { buckets: counts, over };
  }

  summary() {
    const out = {
      enabled: this.enabled,
      metrics: {},
      file: this.file,
    };
    for (const [k, arr] of Object.entries(this.samples)) {
      out.metrics[k] = {
        count: arr.length,
        p50: Telemetry.percentile(arr, 50),
        p95: Telemetry.percentile(arr, 95),
        max: arr.length ? Math.max(...arr) : null,
        buckets: Telemetry.bucketize(arr),
      };
    }
    return out;
  }
}

module.exports = { Telemetry, BUCKETS_MS };
