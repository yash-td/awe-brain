@echo off
title Get PC IP Address for Netlify Configuration
echo.
echo ========================================
echo   IP ADDRESS FOR NETLIFY DEPLOYMENT
echo ========================================
echo.
echo Your PC's network configuration:
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ========================================
echo INSTRUCTIONS:
echo.
echo 1. Use the IPv4 address from your main network adapter
echo    (usually 192.168.x.x or 10.x.x.x)
echo.
echo 2. Update netlify.toml file:
echo    VITE_LOCAL_API_URL = "http://YOUR_IP:3002/api"
echo.
echo 3. Update server CORS settings with your Netlify URL
echo.
echo 4. Configure Windows Firewall to allow port 3002
echo.
echo ========================================
echo.
pause