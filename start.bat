@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

:: ── Check npm ────────────────────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ✗ npm not found. Run setup.bat first.
    echo.
    pause
    exit /b 1
)

:: ── Already running? ─────────────────────────────────────────────────────────
if exist "%~dp0.ims-run\pids.txt" (
    echo.
    echo   ⚠  IMS zaten arka planda çalışıyor gibi görünüyor.
    echo      Önce stop.bat çalıştırın, sonra tekrar deneyin.
    echo.
    pause
    exit /b 1
)

:: ── Header ───────────────────────────────────────────────────────────────────
echo.
echo   ▲ IMS — Inventory Management System
echo.
echo   Çalışma modunu seçin:
echo.
echo     [1]  Terminal pencerelerinde  — Her servis ayrı pencerede açılır,
echo                                    pencereyi kapatınca servis durur.
echo.
echo     [2]  Arka planda (gizli)      — Servisler görünmez şekilde çalışır,
echo                                    durdurmak için stop.bat kullanın.
echo.
set /p MODE="  Seçiminiz (1/2): "

if "%MODE%"=="2" goto :background
goto :foreground

:: ════════════════════════════════════════════════════════════════════════════
:foreground
echo.
echo   ▸ Terminal modunda başlatılıyor...
echo.

start "IMS - Backend"    cmd /k "title IMS - Backend    && cd /d "%~dp0backend"    && npm run dev"
start "IMS - Admin Panel" cmd /k "title IMS - Admin Panel && cd /d "%~dp0frontend"   && npm run dev"
start "IMS - Public App"  cmd /k "title IMS - Public App  && cd /d "%~dp0public-app" && npm run dev"

call :show_urls
echo   Servisleri durdurmak için açılan her pencereyi kapatın.
echo.
pause
exit /b 0

:: ════════════════════════════════════════════════════════════════════════════
:background
echo.
echo   ▸ Arka plan modunda başlatılıyor...
echo.

:: Log ve PID klasörünü oluştur
set PID_DIR=%~dp0.ims-run
if not exist "%PID_DIR%" mkdir "%PID_DIR%"

:: Her servisi gizli pencereyle başlat, PID'i kaydet
powershell -NoProfile -Command ^
    "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d \"%~dp0backend\" && npm run dev > \"%PID_DIR%\backend.log\" 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File '%PID_DIR%\backend.pid' -Encoding ascii"

powershell -NoProfile -Command ^
    "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d \"%~dp0frontend\" && npm run dev > \"%PID_DIR%\frontend.log\" 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File '%PID_DIR%\frontend.pid' -Encoding ascii"

powershell -NoProfile -Command ^
    "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d \"%~dp0public-app\" && npm run dev > \"%PID_DIR%\public-app.log\" 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File '%PID_DIR%\public-app.pid' -Encoding ascii"

:: Tüm PID'leri tek dosyada topla (stop.bat için)
type "%PID_DIR%\backend.pid"    > "%PID_DIR%\pids.txt"
type "%PID_DIR%\frontend.pid"   >> "%PID_DIR%\pids.txt"
type "%PID_DIR%\public-app.pid" >> "%PID_DIR%\pids.txt"

echo   ✓ Tüm servisler arka planda başlatıldı.
echo.
echo   Loglar:
echo     %PID_DIR%\backend.log
echo     %PID_DIR%\frontend.log
echo     %PID_DIR%\public-app.log
echo.
call :show_urls
echo   Servisleri durdurmak için: stop.bat
echo.
pause
exit /b 0

:: ════════════════════════════════════════════════════════════════════════════
:show_urls
echo.
:: Yerel IP tespiti
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4.*192\." /c:"IPv4.*10\." /c:"IPv4.*172\."') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
    goto :url_print
)
:url_print
if defined LOCAL_IP (
    echo   Uygulamayı açmak için:
    echo     http://%LOCAL_IP%:3001  ← ağdaki tüm cihazlardan
    echo     http://localhost:3001   ← bu bilgisayardan
) else (
    echo   Uygulamayı açmak için: http://localhost:3001
)
echo.
exit /b 0
