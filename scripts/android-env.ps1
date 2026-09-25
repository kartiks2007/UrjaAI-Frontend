$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$toolRoot = Join-Path $workspace 'work/android-tools'
$jdk = Get-ChildItem (Join-Path $toolRoot 'jdk') -Directory | Select-Object -First 1
if (-not $jdk) { throw 'Workspace JDK not installed.' }
$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = Join-Path $toolRoot 'sdk'
$env:ANDROID_USER_HOME = Join-Path $toolRoot 'android-user'
$env:GRADLE_USER_HOME = Join-Path $toolRoot 'gradle'
$env:JAVA_TOOL_OPTIONS = '-Duser.home="' + (Join-Path $toolRoot 'android-user') + '"'
$env:PATH = "$($env:JAVA_HOME)/bin;$($env:ANDROID_HOME)/platform-tools;$env:PATH"
