#!/usr/bin/env bash
# Cai dat day chuyen /day_chuyen_all (v2) vao Claude Code.
# Dung:
#   ./cai-dat.sh                          # cap user    (~/.claude)
#   ./cai-dat.sh project /duong/dan/du-an # cap du an   (<du-an>/.claude)
# File cung ten da co se duoc sao luu truoc khi ghi de.
set -euo pipefail

PHAM_VI="${1:-user}"
DU_AN="${2:-$PWD}"
NGUON="$(cd "$(dirname "$0")" && pwd)"

case "$PHAM_VI" in
  user) DICH="$HOME/.claude" ;;
  project) DICH="$DU_AN/.claude" ;;
  *) echo "Dung: $0 [user|project] [duong-dan-du-an]" >&2; exit 2 ;;
esac

SAO_LUU="$DICH/day-chuyen-sao-luu/$(date +%Y%m%d-%H%M%S)"

for f in agents/dc-planner.md agents/dc-coder.md agents/dc-tester.md agents/dc-reviewer.md commands/day_chuyen_all.md; do
  [ -f "$NGUON/$f" ] || { echo "Thieu file nguon: $NGUON/$f" >&2; exit 1; }
  mkdir -p "$DICH/$(dirname "$f")"
  if [ -f "$DICH/$f" ]; then
    mkdir -p "$SAO_LUU/$(dirname "$f")"
    cp "$DICH/$f" "$SAO_LUU/$f"
  fi
  cp "$NGUON/$f" "$DICH/$f"
  echo "Da cai: $DICH/$f"
done

if [ -d "$SAO_LUU" ]; then
  echo "Ban cu da sao luu o: $SAO_LUU"
fi
echo "Xong. Mo phien Claude Code moi roi go: /day_chuyen_all <yeu cau>"
