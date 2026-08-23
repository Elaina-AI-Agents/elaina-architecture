import assert from "node:assert/strict";
import test from "node:test";

import { createPuppeteerConfig } from "../scripts/mermaid-runtime.mjs";

test("disables Chromium sandbox only on Linux CI", () => {
  const config = createPuppeteerConfig({ platform: "linux", ci: "true" });

  assert.deepEqual(config, { args: ["--no-sandbox"] });
  assert.equal(Object.isFrozen(config), true);
  assert.equal(Object.isFrozen(config.args), true);
});

test("keeps Chromium sandbox defaults outside Linux CI", () => {
  assert.deepEqual(createPuppeteerConfig({ platform: "darwin", ci: "true" }), {});
  assert.deepEqual(createPuppeteerConfig({ platform: "linux", ci: "false" }), {});
  assert.deepEqual(createPuppeteerConfig({ platform: "win32" }), {});
});
