/**
 * Phase D2 — thin control plane (not a full Codex App Server).
 *
 * Surfaces health + agent status for UI, tests, and telemetry without
 * re-implementing the agent loop. Intelligence stays in `grok` CLI / ACP.
 */
"use strict";

class ControlPlane {
  /**
   * @param {{
   *   getClient: () => any,
   *   getWorkspace: () => string|null,
   *   resolveExecutable: () => string,
   *   getConnectOptions: () => object,
   *   getVersion: () => string,
   *   getSlots?: () => object[],
   *   telemetry?: import('./telemetry.cjs').Telemetry | null,
   * }} deps
   */
  constructor(deps) {
    this.deps = deps;
  }

  health() {
    const client = this.deps.getClient();
    const state = client?.connectionState || "disconnected";
    const exe = this.deps.resolveExecutable();
    const slots = typeof this.deps.getSlots === "function" ? this.deps.getSlots() : [];
    return {
      ok: true,
      product: "Grok Build Desktop",
      version: this.deps.getVersion(),
      architecture: "cli-acp-shell",
      agentLoopOwner: "grok-cli",
      protocol: "acp-stdio",
      executable: exe,
      workspace: this.deps.getWorkspace(),
      connectionState: state,
      sessionId: client?.sessionId || null,
      connected: state === "connected" || state === "running",
      warm: state === "connected" || state === "running" || state === "starting",
      launch: this.deps.getConnectOptions?.() || {},
      slots,
      slotCount: slots.length,
      ts: new Date().toISOString(),
    };
  }

  /**
   * Contract for E2E / future App-Server: capabilities the shell exposes.
   * Does not invent agent tools — only host surfaces.
   */
  capabilities() {
    return {
      surfaces: [
        "chat-acp",
        "sessions",
        "terminal",
        "fs-host",
        "jobs-headless",
        "artifacts",
        "worktree-cli",
        "git-status",
        "ide-deeplink",
        "agent-supervisor-slots",
      ],
      forbidden: [
        "agent-loop-in-electron",
        "model-api-from-renderer",
        "full-code-oss-embed",
      ],
      telemetry: Boolean(this.deps.telemetry?.enabled),
      maxAgentSlots: 2,
    };
  }

  snapshot() {
    return {
      health: this.health(),
      capabilities: this.capabilities(),
      telemetry: this.deps.telemetry ? this.deps.telemetry.summary() : { enabled: false },
    };
  }
}

module.exports = { ControlPlane };
