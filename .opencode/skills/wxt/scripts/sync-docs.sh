#!/usr/bin/env bash
# Refresh the WXT skill references from WXT's official LLM knowledge dumps.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading WXT knowledge dumps..."
curl -fsSL "https://wxt.dev/knowledge/docs.txt" -o "$TMP_DIR/docs.txt"
curl -fsSL "https://wxt.dev/knowledge/api-reference.txt" -o "$TMP_DIR/api-reference.txt"

echo "Rebuilding references..."
python3 "$SKILL_DIR/scripts/build-references.py" \
  "$TMP_DIR/docs.txt" \
  "$TMP_DIR/api-reference.txt" \
  "$SKILL_DIR/references"

echo "Done. Review the diff before committing."
