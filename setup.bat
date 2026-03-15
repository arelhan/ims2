@echo off
echo === Inventory Management System Setup ===
echo.

echo [1/3] Setting up backend...
cd backend
call npm install
call npx prisma migrate dev --name init
call npx prisma db seed
cd ..

echo.
echo [2/3] Setting up frontend (Admin Panel)...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Setting up public-app (QR Scan)...
cd public-app
call npm install
cd ..

echo.
echo === Setup complete! ===
echo.
echo Start the apps:
echo   Terminal 1: cd backend ^&^& npm run dev   (http://localhost:4000)
echo   Terminal 2: cd frontend ^&^& npm run dev  (http://localhost:3001)
echo   Terminal 3: cd public-app ^&^& npm run dev (http://localhost:3002)
echo.
echo Admin login: admin@company.com / admin123
pause
