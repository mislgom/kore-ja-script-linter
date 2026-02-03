@echo off
chcp 65001 >nul
echo ========================================
echo 스크립트 검수 시스템 로컬 서버 시작
echo ========================================
echo.
echo 서버 주소: http://localhost:8000
echo 종료: Ctrl+C
echo.

REM Node.js 확인
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [Node.js 서버 실행 중...]
    npx -y http-server -p 8000 -c-1 --cors
    goto :end
)

REM Python 확인
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [Python 서버 실행 중...]
    python -m http.server 8000
    goto :end
)

REM 둘 다 없는 경우
echo.
echo [오류] Node.js 또는 Python이 설치되어 있지 않습니다.
echo.
echo 해결 방법:
echo 1. VS Code 확장: "Live Server" 설치 후 index.html 우클릭 → "Open with Live Server"
echo 2. Node.js 설치: https://nodejs.org
echo 3. Python 설치: https://www.python.org
echo.
pause

:end
