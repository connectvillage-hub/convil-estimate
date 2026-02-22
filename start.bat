@echo off
chcp 65001 > nul
title 컨빌 디자인 - 견적서 시스템

echo ================================================
echo   컨빌 디자인 견적서 자동 생성 시스템 시작
echo ================================================
echo.

set NODE_PATH=C:\Program Files\nodejs
set PYTHON_PATH=%LOCALAPPDATA%\Programs\Python\Python312
set PYTHON_SCRIPTS=%LOCALAPPDATA%\Programs\Python\Python312\Scripts
set PATH=%NODE_PATH%;%PYTHON_PATH%;%PYTHON_SCRIPTS%;%PATH%

echo [1/2] 백엔드 서버 시작 중... (http://localhost:8000)
start "컨빌-백엔드" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo [2/2] 프론트엔드 서버 시작 중... (http://localhost:3000)
start "컨빌-프론트엔드" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo ================================================
echo   서버가 시작되었습니다!
echo   브라우저: http://localhost:3000
echo   API 문서: http://localhost:8000/docs
echo ================================================
echo.

start "" http://localhost:3000

pause
