#!/usr/bin/env bash
set -euo pipefail

echo "== Running test harness =="

has_script() {
  local script_name="$1"
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$script_name'] ? 0 : 1)" 2>/dev/null
}

if [ -f package.json ] && [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
  if has_script test; then
    pnpm test
  elif has_script check; then
    pnpm run check
  else
    echo "No pnpm test/check script found in package.json."
  fi
elif [ -f package.json ] && [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then
  if has_script test; then
    yarn test
  elif has_script check; then
    yarn check
  else
    echo "No yarn test/check script found in package.json."
  fi
elif [ -f package.json ] && [ -f bun.lockb ] && command -v bun >/dev/null 2>&1; then
  if has_script test; then
    bun test
  elif has_script check; then
    bun run check
  else
    echo "No bun test/check script found in package.json."
  fi
elif [ -f package.json ] && [ -f package-lock.json ]; then
  if has_script test; then
    npm test
  elif has_script check; then
    npm run check
  else
    echo "No npm test/check script found in package.json."
  fi
elif [ -f package.json ] && command -v npm >/dev/null 2>&1; then
  if has_script test; then
    npm test
  elif has_script check; then
    npm run check
  else
    echo "No npm test/check script found in package.json."
  fi
elif [ -f turbo.json ] && command -v npx >/dev/null 2>&1; then
  npx turbo run test
elif [ -f Cargo.toml ]; then
  cargo test
elif [ -f go.mod ]; then
  go test ./...
elif [ -f Makefile ] || [ -f makefile ]; then
  if make -n test >/dev/null 2>&1; then
    make test
  else
    echo "Makefile found, but no test target was detected."
  fi
elif [ -f pyproject.toml ] || [ -f pytest.ini ]; then
  if command -v uv >/dev/null 2>&1 && [ -f uv.lock ]; then
    uv run pytest
  else
    python -m pytest
  fi
elif [ -f requirements.txt ]; then
  python -m pytest
else
  echo "No known test setup found."
fi
