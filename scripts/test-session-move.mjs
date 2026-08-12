import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { listLocalSessions, moveLocalSession } from "../packages/sessions/dist/index.js";

const grokHome = await mkdtemp(path.join(os.tmpdir(), "grok-build-session-move-"));
const sessionId = "move-fixture-session";
const sourceCwd = "C:\\work\\source project";
const targetCwd = "D:\\projects\\target project";
const sourceDir = path.join(grokHome, "sessions", encodeURIComponent(sourceCwd), sessionId);

try {
  await mkdir(sourceDir, { recursive: true });
  await writeFile(
    path.join(sourceDir, "summary.json"),
    JSON.stringify({
      info: { id: sessionId, cwd: sourceCwd },
      session_summary: "Move this conversation",
      num_chat_messages: 4,
      updated_at: "2026-08-12T00:00:00.000Z",
    }),
  );
  await writeFile(
    path.join(sourceDir, "chat_history.jsonl"),
    `${JSON.stringify({ type: "user", content: "Move this conversation" })}\n`,
  );

  const result = await moveLocalSession({ sessionId, targetCwd, grokHome });
  assert.equal(result.moved, true);
  assert.equal(result.previousCwd, sourceCwd);
  assert.equal(result.cwd, targetCwd);
  const sameTarget = await moveLocalSession({ sessionId, targetCwd, grokHome });
  assert.equal(sameTarget.moved, false);

  const oldList = await listLocalSessions({ cwd: sourceCwd, grokHome });
  const newList = await listLocalSessions({ cwd: targetCwd, grokHome });
  assert.equal(oldList.length, 0);
  assert.equal(newList.length, 1);
  assert.equal(newList[0].id, sessionId);
  assert.equal(newList[0].cwd, targetCwd);

  const movedSummary = JSON.parse(
    await readFile(
      path.join(grokHome, "sessions", encodeURIComponent(targetCwd), sessionId, "summary.json"),
      "utf8",
    ),
  );
  assert.equal(movedSummary.info.cwd, targetCwd);
  console.log("Session move regression: passed");
} finally {
  await rm(grokHome, { recursive: true, force: true });
}
