import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkSourceDrift,
  formatDriftReport,
  main,
  parseManifest,
} from "../scripts/check-source-drift.mjs";

const AI_SHA = "0597bf2ff8e75d09c403f7992a03fe08cba5e0da";
const WA_SHA = "cd2f34ae6fe09217d47556b4fec18d429847eb85";

function manifest(overrides = {}) {
  return {
    schemaVersion: 1,
    inspectedAt: "2026-08-23",
    sources: [
      {
        repository: "Elaina-AI-Agents/ai-agents",
        branch: "main",
        commit: AI_SHA,
        role: "Agent API",
      },
      {
        repository: "Elaina-AI-Agents/whatsapp",
        branch: "main",
        commit: WA_SHA,
        role: "WhatsApp adapter",
      },
    ],
    ...overrides,
  };
}

function response(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("parseManifest returns a deeply frozen validated manifest", () => {
  const parsed = parseManifest(JSON.stringify(manifest()));

  assert.equal(parsed.sources.length, 2);
  assert.equal(parsed.sources[0].commit, AI_SHA);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.sources), true);
  assert.equal(Object.isFrozen(parsed.sources[0]), true);
});

test("parseManifest rejects malformed JSON", () => {
  assert.throws(() => parseManifest("{"), /valid JSON/);
});

test("parseManifest rejects an invalid source snapshot", () => {
  const invalidCases = [
    null,
    [],
    manifest({ schemaVersion: 2 }),
    manifest({ inspectedAt: "23-08-2026" }),
    manifest({ inspectedAt: null }),
    manifest({ sources: [] }),
    manifest({ sources: null }),
    manifest({ sources: [null] }),
    manifest({ sources: [{ repository: "invalid", branch: "main", commit: AI_SHA, role: "API" }] }),
    manifest({ sources: [{ repository: "Org/repo", branch: "", commit: AI_SHA, role: "API" }] }),
    manifest({ sources: [{ repository: "Org/repo", branch: "main", commit: "0597bf2", role: "API" }] }),
    manifest({ sources: [{ repository: "Org/repo", branch: "main", commit: AI_SHA, role: "" }] }),
  ];

  for (const invalid of invalidCases) {
    assert.throws(() => parseManifest(JSON.stringify(invalid)), /manifest/i);
  }
});

test("parseManifest rejects duplicate repositories", () => {
  const duplicate = manifest({
    sources: [manifest().sources[0], { ...manifest().sources[0] }],
  });

  assert.throws(() => parseManifest(JSON.stringify(duplicate)), /duplicate/i);
});

test("checkSourceDrift reports matching and moved source heads", async () => {
  const requested = [];
  const fetchImpl = async (url, options) => {
    requested.push({ url, options });
    const sha = url.includes("ai-agents") ? AI_SHA : "f".repeat(40);
    return response(200, { sha });
  };

  const results = await checkSourceDrift(manifest(), {
    fetchImpl,
    token: "test-token",
  });

  assert.deepEqual(
    results.map(({ repository, status }) => ({ repository, status })),
    [
      { repository: "Elaina-AI-Agents/ai-agents", status: "current" },
      { repository: "Elaina-AI-Agents/whatsapp", status: "drifted" },
    ],
  );
  assert.equal(requested[0].options.headers.authorization, "Bearer test-token");
  assert.match(requested[0].url, /repos\/Elaina-AI-Agents\/ai-agents\/commits\/main$/);
});

test("checkSourceDrift reports GitHub repository not found", async () => {
  await assert.rejects(
    checkSourceDrift(manifest({ sources: [manifest().sources[0]] }), {
      fetchImpl: async () => response(404, { message: "Not Found" }),
    }),
    /repository or branch not found/i,
  );
});

test("checkSourceDrift reports GitHub API failures without leaking payloads", async () => {
  await assert.rejects(
    checkSourceDrift(manifest({ sources: [manifest().sources[0]] }), {
      fetchImpl: async () => response(503, { diagnostic: "must-not-appear" }),
    }),
    (error) => {
      assert.match(error.message, /GitHub API returned 503/);
      assert.doesNotMatch(error.message, /must-not-appear/);
      return true;
    },
  );
});

test("checkSourceDrift rejects malformed GitHub responses and fetch implementations", async () => {
  const oneSource = manifest({ sources: [manifest().sources[0]] });

  await assert.rejects(
    checkSourceDrift(oneSource, {
      fetchImpl: async () => response(200, { sha: "short" }),
    }),
    /invalid commit SHA/i,
  );
  await assert.rejects(
    checkSourceDrift(oneSource, { fetchImpl: 42 }),
    /Fetch-compatible implementation/i,
  );
});

test("formatDriftReport produces an actionable stable report", () => {
  const output = formatDriftReport([
    {
      repository: "Elaina-AI-Agents/ai-agents",
      branch: "main",
      expected: AI_SHA,
      actual: AI_SHA,
      status: "current",
    },
    {
      repository: "Elaina-AI-Agents/whatsapp",
      branch: "main",
      expected: WA_SHA,
      actual: "f".repeat(40),
      status: "drifted",
    },
  ]);

  assert.match(output, /CURRENT.*ai-agents/);
  assert.match(output, /DRIFTED.*whatsapp/);
  assert.match(output, new RegExp(WA_SHA));
});

test("main exits successfully when every source is current", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "elaina-drift-"));
  const manifestPath = path.join(directory, "sources.json");
  await writeFile(manifestPath, JSON.stringify(manifest({ sources: [manifest().sources[0]] })));
  const stdout = [];
  const stderr = [];

  const exitCode = await main({
    manifestPath,
    fetchImpl: async () => response(200, { sha: AI_SHA }),
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.length, 0);
  assert.match(stdout.join("\n"), /CURRENT/);
});

test("main exits non-zero for drift and invalid manifests", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "elaina-drift-"));
  const driftPath = path.join(directory, "drift.json");
  const invalidPath = path.join(directory, "invalid.json");
  await writeFile(driftPath, JSON.stringify(manifest({ sources: [manifest().sources[0]] })));
  await writeFile(invalidPath, "not-json");

  const driftExit = await main({
    manifestPath: driftPath,
    fetchImpl: async () => response(200, { sha: "f".repeat(40) }),
    stdout: () => {},
    stderr: () => {},
  });
  const invalidExit = await main({
    manifestPath: invalidPath,
    fetchImpl: async () => response(200, { sha: AI_SHA }),
    stdout: () => {},
    stderr: () => {},
  });

  assert.equal(driftExit, 1);
  assert.equal(invalidExit, 1);
});
