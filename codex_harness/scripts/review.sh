#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository. Skipping git review output."
  exit 0
fi

echo "== Git status =="
git status --short

echo
echo "== Git diff stat =="
git diff --stat

echo
echo "== Git diff =="
git diff
