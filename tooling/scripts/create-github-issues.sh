#!/usr/bin/env bash
# Create GitHub issues from local markdown files using GitHub CLI (gh).
# Run from repo root: ./tooling/scripts/create-github-issues.sh

set -euo pipefail

# Ensure gh CLI is installed
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed or not in PATH." >&2
  echo "Please install gh: https://cli.github.com/" >&2
  exit 1
fi

# Ensure user is authenticated
if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated." >&2
  echo "Run 'gh auth login' and try again." >&2
  exit 1
fi

ISSUES_DIR="tooling/issues"

if [ ! -d "$ISSUES_DIR" ]; then
  echo "Error: Directory '$ISSUES_DIR' does not exist." >&2
  echo "Generate issue markdown files first (e.g. with generate-issues.sh)." >&2
  exit 1
fi

shopt -s nullglob
issue_files=("$ISSUES_DIR"/*.md)

if [ ${#issue_files[@]} -eq 0 ]; then
  echo "No markdown issue files found in '$ISSUES_DIR'." >&2
  exit 0
fi

for file in "${issue_files[@]}"; do
  # Extract first line starting with '# ' as title
  title="$(grep -m1 '^# ' "$file" | sed 's/^# //')"

  if [ -z "$title" ]; then
    echo "Skipping '$file': no title line starting with '# ' found." >&2
    continue
  fi

  echo "Creating GitHub issue from '$file' with title: $title"
  gh issue create \
    --title "$title" \
    --body-file "$file" \
    --label "needs-triage"
done

