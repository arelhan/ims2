@echo off
:: Bu dosya Task Scheduler tarafından otomatik çalıştırılır.
:: Doğrudan arka plan modunda başlatır, kullanıcıya soru sormaz.
call "%~dp0start.bat" /background
