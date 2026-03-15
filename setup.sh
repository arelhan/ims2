#!/bin/bash
set -euo pipefail

echo ""
echo "  ▲ IMS — Inventory Management System Setup"
echo ""

# ── Helpers ────────────────────────────────────────────────────────────────
ok()   { echo "  ✓ $*"; }
info() { echo "  → $*"; }
fail() { echo ""; echo "  ✗ Error: $*" >&2; exit 1; }

# ── Detect Windows binary (path lives under /mnt/) ─────────────────────────
is_windows_bin() {
  local p
  p=$(command -v "$1" 2>/dev/null) || return 1
  [[ "$p" == /mnt/* ]]
}

# ── Load nvm if already installed ─────────────────────────────────────────
load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" || true
}

# ── Install nvm + Node.js 20 LTS ──────────────────────────────────────────
install_node_lts() {
  info "Installing nvm..."
  if ! command -v curl &>/dev/null; then
    info "curl not found — installing via apt..."
    sudo apt-get update -qq && sudo apt-get install -y curl
    ok "curl installed"
  fi
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  load_nvm
  info "Installing Node.js 20 LTS..."
  nvm install 20
  nvm use 20
  ok "Node.js $(node -v) installed via nvm"
}

# ── Ensure a Linux Node.js >= 18 is active ────────────────────────────────
ensure_node() {
  load_nvm  # try to activate nvm before checking

  if command -v node &>/dev/null && ! is_windows_bin node; then
    local major
    major=$(node -e 'process.stdout.write(process.versions.node.split(".")[0])' 2>/dev/null || echo "0")
    if [ "${major}" -ge 18 ]; then
      ok "Node.js $(node -v)"
      return
    fi
    info "Node.js $(node -v) is too old (requires ≥18). Upgrading..."
    load_nvm
    if command -v nvm &>/dev/null; then
      nvm install 20 && nvm use 20
      ok "Node.js $(node -v)"
      return
    fi
    install_node_lts
    return
  fi

  if is_windows_bin node 2>/dev/null; then
    echo ""
    echo "  ⚠  Windows Node.js detected in WSL PATH — it cannot run Linux scripts."
    echo "     Installing a native Linux version via nvm instead..."
    echo ""
  fi

  install_node_lts
}

# ── Ensure npm is available and is Linux npm ──────────────────────────────
ensure_npm() {
  if ! command -v npm &>/dev/null || is_windows_bin npm; then
    fail "npm not found after Node.js install. Try opening a new terminal and re-running setup.sh"
  fi
  ok "npm $(npm -v)"
}

# ── Prerequisites ──────────────────────────────────────────────────────────
echo "  Checking prerequisites..."
ensure_node
ensure_npm
echo ""

# ── Install dependencies ────────────────────────────────────────────────────
echo "  [1/3] Installing backend dependencies..."
(cd backend && npm install)

echo ""
echo "  [1/3] Running database migrations..."
(cd backend && npx prisma migrate deploy)

echo ""
echo "  [2/3] Installing frontend (Admin Panel)..."
(cd frontend && npm install)

echo ""
echo "  [3/3] Installing public app (QR pages)..."
(cd public-app && npm install)

# ── Detect local network IP ────────────────────────────────────────────────
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || hostname -I 2>/dev/null | awk '{print $1}' || true)

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo "  ✓ Setup complete! Start the apps:"
echo ""
echo "    Terminal 1 — Backend:"
echo "      cd backend && npm run dev"
echo ""
echo "    Terminal 2 — Admin Panel:"
echo "      cd frontend && npm run dev"
echo ""
echo "    Terminal 3 — Public App (QR):"
echo "      cd public-app && npm run dev"
echo ""
echo "  URLs:"
echo "    Admin:  http://localhost:3001"
[ -n "${LOCAL_IP:-}" ] && echo "            http://$LOCAL_IP:3001"
echo "    Public: http://localhost:3002"
[ -n "${LOCAL_IP:-}" ] && echo "            http://$LOCAL_IP:3002"
echo ""
echo "  Open the admin panel and complete the setup wizard to create your admin account."
echo ""
