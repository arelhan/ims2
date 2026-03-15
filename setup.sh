#!/bin/bash
set -e

echo ""
echo "  ▲ IMS — Inventory Management System Setup"
echo ""

# Backend
echo "  [1/3] Installing backend dependencies..."
cd backend
npm install
echo "  [1/3] Running database migrations..."
npx prisma migrate deploy
cd ..

echo ""
echo "  [2/3] Installing frontend (Admin Panel)..."
cd frontend
npm install
cd ..

echo ""
echo "  [3/3] Installing public app (QR pages)..."
cd public-app
npm install
cd ..

# Detect local IP
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || hostname -I 2>/dev/null | awk '{print $1}')

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
if [ -n "$LOCAL_IP" ]; then
  echo "            http://$LOCAL_IP:3001"
fi
echo "    Public: http://localhost:3002"
if [ -n "$LOCAL_IP" ]; then
  echo "            http://$LOCAL_IP:3002"
fi
echo ""
echo "  Open the admin panel and complete the setup wizard to create your admin account."
echo ""
