#!/usr/bin/env bash
# install.sh — copy the htmlcast skill + htmlcast-init command into ~/.claude/
#
# Usage:
#   ./install.sh              # copy (overwrites existing)
#   ./install.sh --dry-run    # show what would happen, change nothing

set -euo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" || "${1:-}" == "-n" ]]; then
  DRY_RUN=1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_ROOT="${HOME}/.claude"
SKILLS_TARGET="${CLAUDE_ROOT}/skills/htmlcast"
COMMAND_TARGET="${CLAUDE_ROOT}/commands/htmlcast-init.md"

SKILL_SOURCE="${REPO_ROOT}/skill"
COMMAND_SOURCE="${REPO_ROOT}/command/htmlcast-init.md"

[[ -d "$SKILL_SOURCE"  ]] || { echo "Missing source: $SKILL_SOURCE"   >&2; exit 1; }
[[ -f "$COMMAND_SOURCE" ]] || { echo "Missing source: $COMMAND_SOURCE" >&2; exit 1; }

echo "claude-htmlcast installer"
echo "  repo:    ${REPO_ROOT}"
echo "  target:  ${CLAUDE_ROOT}"
[[ $DRY_RUN -eq 1 ]] && echo "  mode:    DRY RUN — no changes"
echo ""

echo "  Installing skill -> ${SKILLS_TARGET}"
if [[ $DRY_RUN -eq 0 ]]; then
  mkdir -p "$(dirname "$SKILLS_TARGET")"
  rm -rf "$SKILLS_TARGET"
  cp -R "$SKILL_SOURCE" "$SKILLS_TARGET"
fi

echo "  Installing command -> ${COMMAND_TARGET}"
if [[ $DRY_RUN -eq 0 ]]; then
  mkdir -p "$(dirname "$COMMAND_TARGET")"
  cp "$COMMAND_SOURCE" "$COMMAND_TARGET"
fi

echo ""
echo "Installed."
echo ""
echo "Next steps:"
echo "  1. (one time) npm install -g live-server"
echo "  2. In any project, run /htmlcast-init in Claude Code"
echo "  3. In a separate terminal: live-server .htmlcast/"
