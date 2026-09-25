$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    . "$PSScriptRoot/android-env.ps1"
    & node scripts/android-web.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Android web build failed.' }
    & node scripts/cap.mjs sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed.' }
    & ./android/gradlew.bat -p android --no-daemon --max-workers=2 assembleDebug
    if ($LASTEXITCODE -ne 0) { throw 'Android native build failed.' }
    $apk = Join-Path (Get-Location) 'android/app/build/outputs/apk/debug/app-debug.apk'
    if (-not (Test-Path -LiteralPath $apk)) { throw 'Build returned without an APK.' }
    Copy-Item -LiteralPath $apk -Destination '../urjaai-integration/urjaai-debug.apk'
    Get-Item -LiteralPath $apk | Select-Object FullName,Length
    Get-FileHash -LiteralPath $apk -Algorithm SHA256
} finally { Pop-Location }
