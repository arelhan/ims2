@echo off
chcp 65001 >nul 2>&1

echo.
echo   ▲ IMS — Otomatik başlatmayı kaldır
echo.

schtasks /delete /tn "IMS-AutoStart" /f >nul 2>&1

if errorlevel 1 (
    echo   ⚠  Görev bulunamadı veya silinemedi.
    echo      Zaten kaldırılmış olabilir.
) else (
    echo   ✓ Otomatik başlatma kaldırıldı.
    echo     IMS artık bilgisayar açılışında başlamayacak.
)
echo.
pause
