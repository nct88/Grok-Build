import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { listLocalSessions, updateLocalSessionTitle } from "../packages/sessions/dist/index.js";
import {
  normalizeReasoningEffort,
  sessionRequestMeta,
} from "../packages/acp-client/dist/index.js";

assert.equal(normalizeReasoningEffort("X-High"), "xhigh");
assert.equal(normalizeReasoningEffort("medium"), "medium");
assert.equal(normalizeReasoningEffort("nope"), "");
assert.deepEqual(sessionRequestMeta({ reasoningEffort: "high" }), {
  reasoningEffort: "high",
  reasoning_effort: "high",
});
assert.equal(sessionRequestMeta({ reasoningEffort: "" }), undefined);

const grokHome = await mkdtemp(path.join(os.tmpdir(), "grok-build-session-context-"));
const sessionId = "context-fixture-session";
const cwd = "E:\\projects\\Grok-Build";
const sessionDir = path.join(grokHome, "sessions", encodeURIComponent(cwd), sessionId);

try {
  await mkdir(sessionDir, { recursive: true });
  await writeFile(
    path.join(sessionDir, "summary.json"),
    JSON.stringify({
      info: { id: sessionId, cwd },
      generated_title: "Improve session reasoning flow",
      last_turn_summary: "Added slash recap and ACP effort",
      last_recap: "Desktop now passes reasoning effort on session open and shows last-turn recap.",
      reasoning_effort: "high",
      num_chat_messages: 6,
      updated_at: "2026-08-18T00:00:00.000Z",
    }),
  );
  await writeFile(
    path.join(sessionDir, "chat_history.jsonl"),
    `${JSON.stringify({ type: "user", content: "Improve session reasoning flow" })}\n`,
  );

  const listed = await listLocalSessions({ cwd, grokHome });
  assert.equal(listed.length, 1);
  assert.equal(listed[0].lastTurnSummary, "Added slash recap and ACP effort");
  assert.match(listed[0].lastRecap, /reasoning effort/);
  assert.equal(listed[0].reasoningEffort, "high");

  const renamed = await updateLocalSessionTitle({
    sessionId,
    title: "Manual session title",
    grokHome,
  });
  assert.equal(renamed.title, "Manual session title");
  const afterRename = JSON.parse(await readFile(path.join(sessionDir, "summary.json"), "utf8"));
  assert.equal(afterRename.title_is_manual, true);
  assert.equal(afterRename.generated_title, "Manual session title");

  const auto = await updateLocalSessionTitle({
    sessionId,
    title: "--auto",
    grokHome,
  });
  assert.equal(auto.auto, true);
  const afterAuto = JSON.parse(await readFile(path.join(sessionDir, "summary.json"), "utf8"));
  assert.equal(afterAuto.title_is_manual, false);

  console.log("Session context / ACP effort meta: passed");
} finally {
  await rm(grokHome, { recursive: true, force: true });
}
