#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.ims-run"

# ── Load nvm ────────────────────────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" || true

# ── Colors ───────────────────────────────────────────────────────────────────
R='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
C_BE='\033[0;36m'   # backend  — cyan
C_FE='\033[0;32m'   # frontend — green
C_PU='\033[0;35m'   # public   — magenta
C_WN='\033[0;33m'   # warning  — yellow

# ── Helpers ───────────────────────────────────────────────────────────────────
pfx() {
  local label=$1 color=$2
  while IFS= read -r line; do
    printf "${color}▸ %-9s${R} %s\n" "$label" "$line"
  done
}

STOPPED=0
stop_all() {
  [ "$STOPPED" -eq 1 ] && return
  STOPPED=1
  echo ""
  echo -e "  ${C_WN}Stopping all services...${R}"
  if [ -d "$PID_DIR" ]; then
    for f in "$PID_DIR"/*.pid; do
      [ -f "$f" ] || continue
      local_pid=$(cat "$f")
      kill "$local_pid" 2>/dev/null || true
      pkill -P "$local_pid" 2>/dev/null || true
    done
    rm -rf "$PID_DIR"
  fi
  echo "  ✓ All stopped."
  echo ""
}

trap stop_all EXIT SIGINT SIGTERM

# ── Already running? ──────────────────────────────────────────────────────────
if [ -d "$PID_DIR" ]; then
  echo ""
  echo -e "  ${C_WN}⚠  IMS appears to already be running.${R}"
  echo "     Run ./stop.sh first, then try again."
  echo ""
  exit 1
fi

# ── Check Node.js ─────────────────────────────────────────────────────────────
if ! command -v npm &>/dev/null || [[ "$(command -v npm)" == /mnt/* ]]; then
  echo ""
  echo "  ✗ Linux npm not found. Run ./setup.sh first."
  echo ""
  exit 1
fi

mkdir -p "$PID_DIR"

# ── Start a service (uses exec to replace subshell so PID = npm PID) ──────────
start_service() {
  local name=$1 color=$2 dir=$3
  local pidfile="$PID_DIR/$name.pid"
  (
    echo $BASHPID > "$pidfile"
    cd "$SCRIPT_DIR/$dir"
    exec npm run dev
  ) 2>&1 | pfx "$name" "$color" &
}

# ── Header ────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${BOLD}▲ IMS — Starting all services${R}"
echo ""

start_service "backend"  "$C_BE" "backend"
start_service "frontend" "$C_FE" "frontend"
start_service "public"   "$C_PU" "public-app"

# ── Detect local network IP ───────────────────────────────────────────────────
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || hostname -I 2>/dev/null | awk '{print $1}' || true)

echo -e "  ${DIM}Logs streaming below — press Ctrl+C to stop all services.${R}"
echo ""
echo -e "  URLs (ready in a few seconds):"
echo -e "    ${C_FE}Admin:${R}   http://localhost:3001"
[ -n "${LOCAL_IP:-}" ] && echo -e "             http://$LOCAL_IP:3001"
echo -e "    ${C_PU}Public:${R}  http://localhost:3002"
[ -n "${LOCAL_IP:-}" ] && echo -e "             http://$LOCAL_IP:3002"
echo -e "    ${C_BE}API:${R}     http://localhost:4000"
echo ""

wait
