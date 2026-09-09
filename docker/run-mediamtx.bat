@echo off
REM INSIGHT — MediaMTX RTSP-to-WebRTC Server
REM Prerequisites: Docker Desktop running

echo ===================================
echo  INSIGHT — MediaMTX Setup
echo ===================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH.
    echo Install Docker Desktop from https://docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker daemon is not running.
    echo Start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Starting MediaMTX server...
echo.
echo Ports:
echo   RTSP:    8554
echo   RTMP:    1935
echo   HLS:     8888
echo   WebRTC:  8889
echo.

docker run --rm -it ^
    -e MTX_PROTOCOLS=tcp ^
    -e MTX_WEBRTCADDRES=:8889 ^
    -e MTX_LOGLEVEL=info ^
    -p 8554:8554 ^
    -p 1935:1935 ^
    -p 8888:8888 ^
    -p 8889:8889 ^
    -p 8889:8889/udp ^
    bluenviron/mediamtx:latest
