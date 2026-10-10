#!/usr/bin/env bash
# Usage:
#   bash scripts/push-to-github.sh [repo-name] [public|private]
# Auth (pick one):
#   1) GitHub CLI already logged in:   gh auth login
#   2) Env vars:                        GITHUB_USER=you GITHUB_TOKEN=ghp_xxx  (token needs "repo" scope)
set -euo pipefail

REPO="${1:-rahulshettyacademy-playwright-framework}"
VIS="${2:-public}"

[ -d .git ] || git init -b main
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-qa-bot}" -c user.email="${GIT_AUTHOR_EMAIL:-qa-bot@users.noreply.github.com}" commit -m "Playwright framework + test results" 2>/dev/null || echo "Nothing new to commit"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh repo create "$REPO" "--$VIS" --source=. --remote=origin --push || git push -u origin main
else
  : "${GITHUB_USER:?Set GITHUB_USER}" "${GITHUB_TOKEN:?Set GITHUB_TOKEN}"
  PRIVATE=$([ "$VIS" = "private" ] && echo true || echo false)
  curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
    https://api.github.com/user/repos -d "{\"name\":\"$REPO\",\"private\":$PRIVATE}" >/dev/null || true
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO}.git"
  git push -u origin main
  git remote set-url origin "https://github.com/${GITHUB_USER}/${REPO}.git"   # strip token from stored remote
fi
echo "Done: https://github.com/${GITHUB_USER:-<you>}/$REPO"
