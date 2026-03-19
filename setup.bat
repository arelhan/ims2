@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

echo.
echo   ▲ IMS — Inventory Management System Setup
echo.

:: ── Check Node.js ─────────────────────────────────────────────────────────────
echo   Checking prerequisites...

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ✗ Node.js not found.
    echo     Please install Node.js 18 or newer from https://nodejs.org
    echo     Then re-run this script.
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
node -e "process.exit(parseInt(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)" >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ✗ Node.js version is too old. Please install Node.js 18 or newer.
    echo     Download: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do echo   ✓ Node.js %%v

where npm >nul 2>&1
if errorlevel 1 (
    echo   ✗ npm not found. Please reinstall Node.js.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('npm -v') do echo   ✓ npm %%v
echo.

:: ── Create env files if they don't exist ─────────────────────────────────────
echo   Setting up environment files...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    :: Generate a simple random JWT_SECRET using PowerShell
    for /f "delims=" %%s in ('powershell -NoProfile -Command "[System.Convert]::ToBase64String((1..36 | ForEach-Object { [byte](Get-Random -Maximum 256) }))"') do set JWT_SECRET=%%s
    powershell -NoProfile -Command ^
        "(Get-Content 'backend\.env') -replace 'JWT_SECRET=\"change-this-to-a-secure-random-string\"', ('JWT_SECRET=\"' + '!JWT_SECRET!' + '\"') | Set-Content 'backend\.env'"
    echo   ✓ backend\.env created
) else (
    echo   ✓ backend\.env already exists — skipping
)

if not exist "frontend\.env.local" (
    copy "frontend\.env.local.example" "frontend\.env.local" >nul
    echo   ✓ frontend\.env.local created
) else (
    echo   ✓ frontend\.env.local already exists — skipping
)

if not exist "public-app\.env.local" (
    copy "public-app\.env.local.example" "public-app\.env.local" >nul
    echo   ✓ public-app\.env.local created
) else (
    echo   ✓ public-app\.env.local already exists — skipping
)
echo.

:: ── Install dependencies ──────────────────────────────────────────────────────
echo   Installing dependencies...
echo.

echo   [backend] npm install...
cd backend
call npm install --prefer-offline
if errorlevel 1 ( echo   ✗ backend npm install failed & cd .. & pause & exit /b 1 )
cd ..
echo   ✓ backend dependencies installed

echo   [frontend] npm install...
cd frontend
call npm install --prefer-offline
if errorlevel 1 ( echo   ✗ frontend npm install failed & cd .. & pause & exit /b 1 )
cd ..
echo   ✓ frontend dependencies installed

echo   [public-app] npm install...
cd public-app
call npm install --prefer-offline
if errorlevel 1 ( echo   ✗ public-app npm install failed & cd .. & pause & exit /b 1 )
cd ..
echo   ✓ public-app dependencies installed
echo.

:: ── Database migration ────────────────────────────────────────────────────────
echo   Running database migrations...
cd backend
call npx prisma migrate deploy
if errorlevel 1 ( echo   ✗ Database migration failed & cd .. & pause & exit /b 1 )
cd ..

:: ── Done ─────────────────────────────────────────────────────────────────────
echo.
echo   ✓ Setup complete! Run start.bat to launch all services.
echo.
echo   Or start manually in separate terminals:
echo.
echo     Terminal 1 — Backend:
echo       cd backend ^&^& npm run dev
echo.
echo     Terminal 2 — Admin Panel:
echo       cd frontend ^&^& npm run dev
echo.
echo     Terminal 3 — Public App (QR):
echo       cd public-app ^&^& npm run dev
echo.
echo   Admin Panel: http://localhost:3001
echo.
echo   Open the admin panel and complete the setup wizard to create your admin account.
echo.
pause
