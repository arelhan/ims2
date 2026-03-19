@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

:: ── /background argümanıyla çağrılırsa doğrudan arka plan moduna geç ────────
if /i "%~1"=="/background" goto :background

:: ── npm kontrolü ─────────────────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ✗ npm not found. Run setup.bat first.
    echo.
    pause
    exit /b 1
)

:: ── Zaten arka planda çalışıyor mu? ──────────────────────────────────────────
if exist "%~dp0.ims-run\pids.txt" (
    echo.
    echo   ⚠  IMS zaten arka planda çalışıyor.
    echo      Önce stop.bat çalıştırın, sonra tekrar deneyin.
    echo.
    pause
    exit /b 1
)

:: ── Mod menüsü ────────────────────────────────────────────────────────────────
echo.
echo   ▲ IMS — Inventory Management System
echo.
echo   Çalışma modunu seçin:
echo.
echo     [1]  Terminal pencerelerinde  — Her servis ayrı pencerede açılır,
echo                                    pencereyi kapatınca servis durur.
echo.
echo     [2]  Arka planda (gizli)      — Servisler görünmez çalışır,
echo                                    durdurmak için stop.bat kullanın.
echo.
echo     [3]  Arka planda + otomatik başlat — Bilgisayar her açıldığında
echo                                          otomatik olarak başlar.
echo.
set /p MODE="  Seçiminiz (1/2/3): "

if "%MODE%"=="2" goto :background
if "%MODE%"=="3" goto :autostart
goto :foreground

:: ════════════════════════════════════════════════════════════════════════════
:foreground
echo.
echo   ▸ Terminal modunda başlatılıyor...
echo.

start "IMS - Backend"     cmd /k "title IMS - Backend    && cd /d "%~dp0backend"    && npm run dev"
start "IMS - Admin Panel" cmd /k "title IMS - Admin Panel && cd /d "%~dp0frontend"   && npm run dev"
start "IMS - Public App"  cmd /k "title IMS - Public App  && cd /d "%~dp0public-app" && npm run dev"

call :show_urls
echo   Servisleri durdurmak için açılan her pencereyi kapatın.
echo.
pause
exit /b 0

:: ════════════════════════════════════════════════════════════════════════════
:autostart
echo.
echo   ▸ Arka plan + otomatik başlatma ayarlanıyor...
echo.

:: Önce servisleri başlat
call :start_background

:: Task Scheduler'a kaydet (kullanıcı oturum açınca çalışsın)
schtasks /create ^
    /tn "IMS-AutoStart" ^
    /tr "\"%~dp0start-bg.bat\"" ^
    /sc onlogon ^
    /rl highest ^
    /f >nul 2>&1

if errorlevel 1 (
    echo   ⚠  Otomatik başlatma kaydedilemedi.
    echo      Yönetici olarak çalıştırmayı deneyin.
) else (
    echo   ✓ Otomatik başlatma kaydedildi.
    echo     ^(Kaldırmak için: unregister-startup.bat^)
)
echo.
call :show_urls
echo   Servisleri durdurmak için: stop.bat
echo.
pause
exit /b 0

:: ════════════════════════════════════════════════════════════════════════════
:background
call :start_background
echo.
call :show_urls
echo   Servisleri durdurmak için: stop.bat
echo.
pause
exit /b 0

:: ════════════════════════════════════════════════════════════════════════════
:start_background
set PID_DIR=%~dp0.ims-run
if not exist "%PID_DIR%" mkdir "%PID_DIR%"

echo   Starting backend...
powershell -NoProfile -Command "$p = Start-Process 'cmd.exe' -ArgumentList '/c cd /d ""%~dp0backend"" && npm run dev > ""%PID_DIR%backend.log"" 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File '""%PID_DIR%backend.pid""' -Encoding ascii -NoNewline"

echo   Starting frontend...
powershell -NoProfile -Command "$p = Start-Process 'cmd.exe' -ArgumentList '/c cd /d ""%~dp0frontend"" && npm run dev > ""%PID_DIR%frontend.log"" 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File '""%PID_DIR%frontend.pid""' -Encoding ascii -NoNewline"

echo   Starting public-app...
powershell -NoProfile -Command "$p = Start-Process 'cmd.exe' -ArgumentList '/c cd /d ""%~dp0public-app"" && npm run dev > ""%PID_DIR%public-app.log"" 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File '""%PID_DIR%public-app.pid""' -Encoding ascii -NoNewline"

:: PID'leri birleştir
type "%PID_DIR%backend.pid"    > "%PID_DIR%pids.txt" 2>nul
echo.>> "%PID_DIR%pids.txt"
type "%PID_DIR%frontend.pid"   >> "%PID_DIR%pids.txt" 2>nul
echo.>> "%PID_DIR%pids.txt"
type "%PID_DIR%public-app.pid" >> "%PID_DIR%pids.txt" 2>nul

echo.
echo   ✓ Tüm servisler arka planda başlatıldı.
echo.
echo   Loglar: %PID_DIR%
exit /b 0

:: ════════════════════════════════════════════════════════════════════════════
:show_urls
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4.*192\." /c:"IPv4.*10\." /c:"IPv4.*172\."') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
    goto :url_done
)
:url_done
if defined LOCAL_IP (
    echo   Uygulamayı açmak için:
    echo     http://%LOCAL_IP%:3001  ← ağdaki tüm cihazlardan
    echo     http://localhost:3001   ← bu bilgisayardan
) else (
    echo   Uygulamayı açmak için: http://localhost:3001
)
exit /b 0
