@echo off
setlocal
cd /d "%~dp0"

set "NODE_HOME=%CD%\.tools\node-v20.19.0-win-x64"
if not exist "%NODE_HOME%\node.exe" (
  echo Local Node runtime not found at "%NODE_HOME%".
  exit /b 1
)

set "PATH=%NODE_HOME%;%PATH%"
set "npm_config_cache=%CD%\.npm-cache"

start "guide-api" "%NODE_HOME%\node.exe" "%CD%\server\guideApiServer.mjs"
"%NODE_HOME%\node.exe" "%CD%\node_modules\vite\bin\vite.js" --host 0.0.0.0
