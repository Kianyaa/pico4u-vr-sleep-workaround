$ErrorActionPreference = "Stop"

$binDir = Join-Path $PSScriptRoot "..\bin"
if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

# Pinned so every build bundles the same, verified adb.exe. To update, take the
# windows archive's <url> and <checksum> (SHA-1) for "platform-tools" from
# https://dl.google.com/android/repository/repository2-3.xml
$zipUrl = "https://dl.google.com/android/repository/platform-tools_r37.0.3-win.zip"
$zipSha1 = "7fea85bc18d0480bc81d3603952d666f49496e5a"
$zipPath = Join-Path $env:TEMP "platform-tools.zip"
$extractPath = Join-Path $env:TEMP "platform-tools-extract"

Write-Host "Downloading ADB..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

$actual = (Get-FileHash -Algorithm SHA1 -Path $zipPath).Hash.ToLowerInvariant()
if ($actual -ne $zipSha1) {
    Remove-Item $zipPath -Force
    throw "ADB download checksum mismatch: expected $zipSha1, got $actual"
}

Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

$toolsDir = Join-Path $extractPath "platform-tools"

# Target file name for Tauri sidecar (Windows x64)
$targetName = "adb-x86_64-pc-windows-msvc.exe"

Write-Host "Copying files to $binDir..."
Copy-Item (Join-Path $toolsDir "adb.exe") (Join-Path $binDir $targetName) -Force
Copy-Item (Join-Path $toolsDir "AdbWinApi.dll") (Join-Path $binDir "AdbWinApi.dll") -Force
Copy-Item (Join-Path $toolsDir "AdbWinUsbApi.dll") (Join-Path $binDir "AdbWinUsbApi.dll") -Force
Copy-Item (Join-Path $toolsDir "NOTICE.txt") (Join-Path $binDir "adb-NOTICE.txt") -Force

Write-Host "Cleaning up..."
Remove-Item $zipPath -Force
Remove-Item $extractPath -Recurse -Force

Write-Host "ADB setup complete."
