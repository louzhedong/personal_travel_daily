@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "ROOT_DIR=%CD%"
set "NODE_HOME=%ROOT_DIR%\.tools\node-v20.19.0-win-x64"
set "LOG_DIR=%ROOT_DIR%\.tools\dev-logs"
set "RUN_DIR=%ROOT_DIR%\.tools\run"
set "npm_config_cache=%ROOT_DIR%\.npm-cache"
set "npm_config_registry=https://registry.npmmirror.com"
set "npm_config_replace_registry_host=always"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%RUN_DIR%" mkdir "%RUN_DIR%"

if not exist "%NODE_HOME%\node.exe" (
  echo [error] Local Node runtime not found: "%NODE_HOME%\node.exe"
  echo [hint] Install Node.js 20.19+ or restore the .tools Node runtime.
  exit /b 1
)

set "PATH=%NODE_HOME%;%PATH%"

where docker >nul 2>nul
if errorlevel 1 (
  echo [error] Docker CLI not found. Please install/start Docker Desktop.
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [error] npm.cmd not found. Please install Node.js/npm.
  exit /b 1
)

if not exist "%ROOT_DIR%\.env" (
  if exist "%ROOT_DIR%\.env.example" (
    copy "%ROOT_DIR%\.env.example" "%ROOT_DIR%\.env" >nul
    echo [info] .env missing, copied from .env.example
  ) else (
    echo [error] .env and .env.example are both missing.
    exit /b 1
  )
) else (
  echo [ok] using existing .env
)

if not exist "%ROOT_DIR%\node_modules\.bin\vite.cmd" (
  echo [sync] npm dependencies from npmmirror
  call npm.cmd install --cache "%npm_config_cache%" --registry "%npm_config_registry%" --replace-registry-host always
  if errorlevel 1 exit /b 1
) else (
  echo [ok] node_modules present
)

call :stop_port app-api 8788

echo [start] docker compose mysql + adminer
docker compose up -d mysql adminer
if errorlevel 1 exit /b 1

call :wait_mysql

echo [sync] prisma client
call npm.cmd run db:generate
if errorlevel 1 exit /b 1

echo [sync] prisma migrations
call npm.cmd run db:migrate:deploy
if errorlevel 1 exit /b 1

echo [sync] prisma seed
call npm.cmd run db:seed
if errorlevel 1 exit /b 1

call :is_port_listening 8383
if not errorlevel 1 (
  echo [skip] guide-api already listening on 8383
) else (
  echo [start] guide-api
  start "guide-api" /D "%ROOT_DIR%" /B "%NODE_HOME%\node.exe" "%ROOT_DIR%\server\guideApiServer.mjs" > "%LOG_DIR%\guide-api.log" 2> "%LOG_DIR%\guide-api.err.log"
)

call :is_port_listening 8788
if not errorlevel 1 (
  echo [skip] app-api already listening on 8788
) else (
  echo [start] app-api
  start "app-api" /D "%ROOT_DIR%" /B "%NODE_HOME%\node.exe" "%ROOT_DIR%\node_modules\tsx\dist\cli.mjs" "%ROOT_DIR%\server\appApiServer.ts" > "%LOG_DIR%\app-api.log" 2> "%LOG_DIR%\app-api.err.log"
)

call :is_port_listening 5173
if not errorlevel 1 (
  echo [skip] frontend already listening on 5173
) else (
  echo [start] frontend
  start "frontend" /D "%ROOT_DIR%" /B "%NODE_HOME%\node.exe" "%ROOT_DIR%\node_modules\vite\bin\vite.js" --host 0.0.0.0 > "%LOG_DIR%\frontend.log" 2> "%LOG_DIR%\frontend.err.log"
)

echo.
echo Local dev services:
echo   frontend : http://127.0.0.1:5173/
echo   app-api  : http://127.0.0.1:8788/health
echo   guide-api: http://127.0.0.1:8383/health
echo   mysql    : 127.0.0.1:3306
echo   adminer  : http://127.0.0.1:8080/
echo.
echo Login:
echo   username : demo
echo   password : demo123456
echo.
echo Logs:
echo   %LOG_DIR%\frontend.log
echo   %LOG_DIR%\app-api.log
echo   %LOG_DIR%\guide-api.log
echo.
echo Keep this window open if you want to watch status. Press Ctrl+C to close this launcher window; background services can be stopped from Task Manager or by ports.
echo.

goto :eof

:wait_mysql
echo [wait] mysql health
for /L %%i in (1,1,30) do (
  docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -ppassword >nul 2>nul
  if not errorlevel 1 (
    echo [ok] mysql is ready: 127.0.0.1:3306
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)
echo [warn] mysql did not become ready in time; continuing because compose may still report healthy soon.
exit /b 0

:is_port_listening
netstat -ano -p tcp | findstr /R /C:":%~1 .*LISTENING" >nul 2>nul
exit /b %errorlevel%

:stop_port
set "STOP_NAME=%~1"
set "STOP_PORT=%~2"
for /F "tokens=5" %%p in ('netstat -ano -p tcp ^| findstr /R /C:":%STOP_PORT% .*LISTENING"') do (
  echo [stop] %STOP_NAME% on %STOP_PORT% pid=%%p
  taskkill /PID %%p /T /F >nul 2>nul
)
exit /b 0
