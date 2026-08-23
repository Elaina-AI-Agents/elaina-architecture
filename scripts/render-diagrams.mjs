import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { createPuppeteerConfig } from "./mermaid-runtime.mjs";

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(target);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [target] : [];
  }));
  return nested.flat();
}

function mermaidBlocks(markdown) {
  return [...markdown.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

async function main() {
  const repositoryRoot = process.cwd();
  const docsRoot = path.join(repositoryRoot, "docs");
  const files = [path.join(repositoryRoot, "README.md"), ...await markdownFiles(docsRoot)];
  const workDirectory = await mkdtemp(path.join(tmpdir(), "elaina-mermaid-"));
  const puppeteerConfig = path.join(workDirectory, "puppeteer.json");
  let rendered = 0;

  try {
    await writeFile(
      puppeteerConfig,
      `${JSON.stringify(createPuppeteerConfig())}\n`,
      "utf8",
    );
    for (const file of files) {
      const blocks = mermaidBlocks(await readFile(file, "utf8"));
      for (const diagram of blocks) {
        const input = path.join(workDirectory, `${rendered}.mmd`);
        const output = path.join(workDirectory, `${rendered}.svg`);
        await writeFile(input, `${diagram}\n`, "utf8");
        const result = spawnSync("mmdc", [
          "--quiet",
          "--puppeteerConfigFile",
          puppeteerConfig,
          "--input",
          input,
          "--output",
          output,
        ], {
          cwd: repositoryRoot,
          encoding: "utf8",
          shell: process.platform === "win32",
        });
        if (result.status !== 0) {
          throw new Error(`Mermaid render failed in ${path.relative(repositoryRoot, file)}: ${result.stderr.trim()}`);
        }
        rendered += 1;
      }
    }

    if (rendered === 0) {
      throw new Error("No Mermaid diagrams were found");
    }
    console.log(`Rendered ${rendered} Mermaid diagrams successfully.`);
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
}

await main();
