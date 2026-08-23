#!/usr/bin/env bash
# Structural verification for the Elaina architecture documentation.
# This intentionally mirrors the lightweight documentation gate used by the
# reference architecture repository; the Node.js validation suite adds deeper
# OpenAPI, Mermaid, link, secret, coverage, and source-drift checks.
set -uo pipefail
cd "$(dirname "$0")/.."

OUT=".verify"
mkdir -p "$OUT"
fail=0

docs() {
  find . -name '*.md' \
    -not -path './.git/*' \
    -not -path './node_modules/*' \
    -not -path './.verify/*'
}

echo "==> 1. Placeholder scan"
if docs | xargs grep -nE '\b(TBD|TODO|FIXME|XXX)\b' > "$OUT/placeholders.txt" 2>/dev/null; then
  echo "FAIL: placeholder markers found"
  cat "$OUT/placeholders.txt"
  fail=1
else
  echo "    OK"
fi

echo "==> 2. Code fence balance"
: > "$OUT/fences.txt"
while IFS= read -r file; do
  count=$(grep -c '^```' "$file")
  if (( count % 2 != 0 )); then
    echo "$file has $count fence markers (odd)" >> "$OUT/fences.txt"
  fi
done < <(docs)
if [ -s "$OUT/fences.txt" ]; then
  echo "FAIL: unbalanced code fences"
  cat "$OUT/fences.txt"
  fail=1
else
  echo "    OK"
fi

echo "==> 3. Mermaid fence openers"
: > "$OUT/mermaid.txt"
while IFS= read -r file; do
  grep -nE '^```(mermaid[A-Za-z]+|Mermaid)' "$file" \
    >> "$OUT/mermaid.txt" 2>/dev/null || true
done < <(docs)
if [ -s "$OUT/mermaid.txt" ]; then
  echo "FAIL: malformed Mermaid fence openers"
  cat "$OUT/mermaid.txt"
  fail=1
else
  echo "    OK"
fi

echo "==> 4. Internal links"
: > "$OUT/links.txt"
while IFS= read -r file; do
  directory=$(dirname "$file")
  grep -oE '\]\([^)]+\)' "$file" 2>/dev/null \
    | sed -E 's/^\]\(//; s/\)$//' \
    | while IFS= read -r link; do
        case "$link" in
          http://*|https://*|mailto:*|'#'*) continue ;;
        esac
        target="${link%%#*}"
        [ -z "$target" ] && continue
        if [ ! -e "$directory/$target" ]; then
          echo "$file -> $link" >> "$OUT/links.txt"
        fi
      done
done < <(docs)
if [ -s "$OUT/links.txt" ]; then
  echo "FAIL: broken internal links"
  cat "$OUT/links.txt"
  fail=1
else
  echo "    OK"
fi

echo "==> 5. Pinned snapshot references"
: > "$OUT/snapshots.txt"
node --input-type=module <<'NODE' > "$OUT/snapshots.txt" 2>&1 || fail=1
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("contracts/source-snapshots.json", "utf8"));
const readme = await readFile("README.md", "utf8");
const traceability = await readFile("docs/source-traceability.md", "utf8");

for (const source of manifest.sources) {
  if (!readme.includes(source.commit) || !traceability.includes(source.commit)) {
    throw new Error(`Pinned commit is not discoverable: ${source.repository}`);
  }
}
NODE
if [ -s "$OUT/snapshots.txt" ]; then
  echo "FAIL: pinned snapshot references are incomplete"
  cat "$OUT/snapshots.txt"
else
  echo "    OK"
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Verification failed."
fi
exit "$fail"
