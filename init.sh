#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "=== Fetchtype Init ==="
echo

echo "Recent commits:"
git log --oneline -10 2>/dev/null || echo "(no commits)"
echo

echo "Working tree:"
git status --short
echo

echo "Last session:"
tail -15 proj-progress.txt 2>/dev/null || echo "(no progress log)"
echo

if command -v jq >/dev/null 2>&1 && [[ -f proj-progress.json ]]; then
  echo "Snapshot:"
  jq -r '"Phase: \(.phase)\nGoal: \(.current_goal)\nNext:\n" + (.next | map("  - " + .) | join("\n"))' proj-progress.json
  echo
fi

if command -v jq >/dev/null 2>&1 && [[ -f feature-list.json ]]; then
  total=$(jq '.features | length' feature-list.json)
  passing=$(jq '[.features[] | select(.status == "passing")] | length' feature-list.json)
  in_progress=$(jq '[.features[] | select(.status == "in_progress")] | length' feature-list.json)
  failing=$(jq '[.features[] | select(.status == "failing")] | length' feature-list.json)

  echo "Features: $total total, $passing passing, $in_progress in progress, $failing failing"
  echo "Next failing items:"
  jq -r '.features[] | select(.status == "failing") | "  [\(.id)] \(.description)"' feature-list.json | head -3
  echo
fi

echo "Toolchain:"
command -v node >/dev/null 2>&1 && echo "  Node: $(node -v)"
command -v pnpm >/dev/null 2>&1 && echo "  pnpm: $(pnpm -v)"
command -v jq >/dev/null 2>&1 && echo "  jq: $(jq --version)"
echo

if [[ -f packages/cli/dist/bin.js ]]; then
  echo "CLI smoke:"
  node packages/cli/dist/bin.js --help | sed -n '1,8p'
else
  echo "CLI smoke: build missing; run pnpm build"
fi

echo
echo "Suggested verification:"
echo "  pnpm typecheck"
echo "  pnpm test"
echo "  pnpm build"
echo
echo "=== Ready ==="
