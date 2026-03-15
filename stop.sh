#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.ims-run"

echo ""

if [ ! -d "$PID_DIR" ]; then
  echo "  IMS is not running."
  echo ""
  exit 0
fi

echo "  Stopping IMS services..."
echo ""

for f in "$PID_DIR"/*.pid; do
  [ -f "$f" ] || continue
  name=$(basename "$f" .pid)
  pid=$(cat "$f")
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    pkill -P "$pid" 2>/dev/null || true
    echo "  ✓ $name stopped"
  else
    echo "  - $name was not running"
  fi
done

rm -rf "$PID_DIR"

echo ""
echo "  ✓ All stopped."
echo ""
