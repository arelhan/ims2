@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

set PID_DIR=%~dp0.ims-run

echo.
echo   ▲ IMS — Servisleri durdur
echo.

if not exist "%PID_DIR%\pids.txt" (
    echo   ⚠  Arka planda çalışan bir IMS bulunamadı.
    echo      ^(Terminal modunda çalışıyorsa pencereleri kapatın.^)
    echo.
    pause
    exit /b 0
)

echo   Servisler durduruluyor...

for /f "usebackq delims=" %%p in ("%PID_DIR%\pids.txt") do (
    set PID=%%p
    set PID=!PID: =!
    if defined PID (
        taskkill /PID !PID! /T /F >nul 2>&1
    )
)

:: node.exe süreçleri de temizle (IMS portlarında takılı kalanlar)
for %%port in (3001 3002 4000) do (
    for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":%%port "') do (
        taskkill /PID %%p /F >nul 2>&1
    )
)

rmdir /s /q "%PID_DIR%" 2>nul

echo   ✓ Tüm servisler durduruldu.
echo.
pause
