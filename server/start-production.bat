@echo off
title Movar Brain Production Server
echo.
echo ========================================
echo   MOVAR BRAIN PRODUCTION SERVER
echo ========================================
echo.
echo Starting SQLite server for Netlify...
echo Server will be accessible at port 3002
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%~dp0"
npm start

echo.
echo Server stopped. Press any key to exit.
pause > nul