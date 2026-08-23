import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const numberedDocuments = Object.freeze([
  "docs/01-context.md",
  "docs/02-containers.md",
  "docs/03-components/whatsapp-runtime.md",
  "docs/03-components/agent-api.md",
  "docs/03-components/data-and-knowledge.md",
  "docs/04-flows.md",
  "docs/05-data-model.md",
  "docs/06-security-model.md",
  "docs/07-deployment.md",
  "docs/08-future-work.md",
  "docs/source-traceability.md",
  "docs/security-remediation-backlog.md",
  "tools/verify-docs.sh",
]);

test("publishes the reference-style numbered documentation set", async () => {
  await Promise.all(numberedDocuments.map((path) => access(path)));

  const readme = await readFile("README.md", "utf8");
  for (const path of numberedDocuments) {
    assert.match(readme, new RegExp(path.replace(/[./-]/g, "\\$&")));
  }
});

test("documents all six observed runtime flows as Mermaid sequences", async () => {
  const flows = await readFile("docs/04-flows.md", "utf8");
  const requiredFlows = Object.freeze([
    "Private Chat",
    "Group Mention",
    "Selecting an Agent",
    "Chat History",
    "Text Knowledge",
    "PDF Knowledge",
  ]);

  for (const flow of requiredFlows) {
    assert.match(flows, new RegExp(`^## .*${flow}`, "im"));
  }

  assert.equal(flows.match(/```mermaid\nsequenceDiagram/g)?.length, 6);
});

test("keeps the observed contract and pinned source manifest discoverable", async () => {
  const readme = await readFile("README.md", "utf8");
  assert.match(readme, /contracts\/openapi\.yaml/);
  assert.match(readme, /contracts\/source-snapshots\.json/);

  const manifest = JSON.parse(
    await readFile("contracts/source-snapshots.json", "utf8"),
  );
  assert.equal(manifest.sources.length, 3);
});
