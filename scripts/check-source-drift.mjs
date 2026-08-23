import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function manifestError(message) {
  return new TypeError(`Invalid source snapshot manifest: ${message}`);
}

function normalizeSource(source, index) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw manifestError(`sources[${index}] must be an object`);
  }

  const repository = typeof source.repository === "string" ? source.repository.trim() : "";
  const branch = typeof source.branch === "string" ? source.branch.trim() : "";
  const commit = typeof source.commit === "string" ? source.commit.trim().toLowerCase() : "";
  const role = typeof source.role === "string" ? source.role.trim() : "";

  if (!REPOSITORY_PATTERN.test(repository)) {
    throw manifestError(`sources[${index}].repository must be owner/name`);
  }
  if (!branch) {
    throw manifestError(`sources[${index}].branch must be non-empty`);
  }
  if (!COMMIT_PATTERN.test(commit)) {
    throw manifestError(`sources[${index}].commit must be a full 40-character SHA`);
  }
  if (!role) {
    throw manifestError(`sources[${index}].role must be non-empty`);
  }

  return Object.freeze({ repository, branch, commit, role });
}

export function parseManifest(rawManifest) {
  let input;
  try {
    input = JSON.parse(rawManifest);
  } catch {
    throw manifestError("file must contain valid JSON");
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw manifestError("root must be an object");
  }
  if (input.schemaVersion !== 1) {
    throw manifestError("schemaVersion must equal 1");
  }
  if (typeof input.inspectedAt !== "string" || !DATE_PATTERN.test(input.inspectedAt)) {
    throw manifestError("inspectedAt must use YYYY-MM-DD");
  }
  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    throw manifestError("sources must be a non-empty array");
  }

  const sources = Object.freeze(input.sources.map(normalizeSource));
  const repositories = new Set(sources.map(({ repository }) => repository));
  if (repositories.size !== sources.length) {
    throw manifestError("duplicate repositories are not allowed");
  }

  return Object.freeze({
    schemaVersion: 1,
    inspectedAt: input.inspectedAt,
    sources,
  });
}

function requestHeaders(token) {
  const baseHeaders = {
    accept: "application/vnd.github+json",
    "user-agent": "elaina-architecture-drift-checker",
    "x-github-api-version": "2022-11-28",
  };

  return token
    ? Object.freeze({ ...baseHeaders, authorization: `Bearer ${token}` })
    : Object.freeze({ ...baseHeaders });
}

async function fetchHead(source, { fetchImpl, token }) {
  const repositoryPath = source.repository
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const branch = encodeURIComponent(source.branch);
  const url = `https://api.github.com/repos/${repositoryPath}/commits/${branch}`;
  const response = await fetchImpl(url, { headers: requestHeaders(token) });

  if (response.status === 404) {
    throw new Error(`GitHub repository or branch not found: ${source.repository}@${source.branch}`);
  }
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${source.repository}@${source.branch}`);
  }

  const payload = await response.json();
  const actual = typeof payload.sha === "string" ? payload.sha.toLowerCase() : "";
  if (!COMMIT_PATTERN.test(actual)) {
    throw new Error(`GitHub API returned an invalid commit SHA for ${source.repository}@${source.branch}`);
  }

  return Object.freeze({
    repository: source.repository,
    branch: source.branch,
    expected: source.commit,
    actual,
    status: actual === source.commit ? "current" : "drifted",
  });
}

export async function checkSourceDrift(manifestInput, options = {}) {
  const validated = parseManifest(JSON.stringify(manifestInput));
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A Fetch-compatible implementation is required");
  }

  const results = await Promise.all(
    validated.sources.map((source) =>
      fetchHead(source, { fetchImpl, token: options.token }),
    ),
  );
  return Object.freeze(results);
}

export function formatDriftReport(results) {
  return results
    .map((result) => {
      const label = result.status === "current" ? "CURRENT" : "DRIFTED";
      return `${label} ${result.repository}@${result.branch} expected=${result.expected} actual=${result.actual}`;
    })
    .join("\n");
}

export async function main(options = {}) {
  const manifestPath = options.manifestPath
    ?? path.join(process.cwd(), "contracts", "source-snapshots.json");
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const stdout = options.stdout ?? console.log;
  const stderr = options.stderr ?? console.error;
  const token = options.token ?? process.env.GITHUB_TOKEN;

  try {
    const rawManifest = await readFile(manifestPath, "utf8");
    const parsed = parseManifest(rawManifest);
    const results = await checkSourceDrift(parsed, { fetchImpl, token });
    stdout(formatDriftReport(results));
    return results.some(({ status }) => status === "drifted") ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    stderr(`Source drift check failed: ${message}`);
    return 1;
  }
}

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  process.exitCode = await main({
    manifestPath: process.argv[2],
  });
}
