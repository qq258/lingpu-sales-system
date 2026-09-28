#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This build script must run on Linux so Prisma generates a Linux-compatible client." >&2
  exit 1
fi

command -v node >/dev/null || { echo "Node.js is required." >&2; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm is required." >&2; exit 1; }

echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
pnpm install --frozen-lockfile
pnpm --filter @phone-sales/server prisma:generate
pnpm build:server
pnpm build:portal

test -f server/dist/index.js
test -f portal/dist/index.html
echo "Linux build complete: server/dist and portal/dist are ready."
