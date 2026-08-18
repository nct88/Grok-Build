export const REASONING_EFFORT_VALUES = ["low", "medium", "high", "xhigh"] as const;

/** Grok CLI 1.0.5 accepts reasoning effort when an ACP client opens or resumes. */
export function normalizeReasoningEffort(value?: string | null): string {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (raw === "xhigh" || raw === "extrahigh") return "xhigh";
  return (REASONING_EFFORT_VALUES as readonly string[]).includes(raw) ? raw : "";
}

/**
 * `_meta` payload for `session/new` and `session/load`.
 * Grok Build 1.0.5 reads reasoning effort here in addition to `--reasoning-effort`.
 */
export function sessionRequestMeta(options: {
  reasoningEffort?: string | null;
}): Record<string, unknown> | undefined {
  const reasoningEffort = normalizeReasoningEffort(options.reasoningEffort);
  if (!reasoningEffort) return undefined;
  return {
    reasoningEffort,
    reasoning_effort: reasoningEffort,
  };
}
