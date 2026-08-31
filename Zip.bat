@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo       RENTools - Creating ZIP
echo ========================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$root=(Get-Location).Path; $zip=Join-Path $root 'Rentools.zip'; if(Test-Path $zip){Remove-Item $zip -Force}; Add-Type -AssemblyName System.IO.Compression; Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive=[System.IO.Compression.ZipFile]::Open($zip,[System.IO.Compression.ZipArchiveMode]::Create); Get-ChildItem $root -Recurse -Force -File | Where-Object { $r=$_.FullName.Substring($root.Length).TrimStart('\'); $top=$r.Split('\')[0]; $top -notin @('public','node_modules','dist','.git') -and $_.Name -ne 'Rentools.zip' -and $_.Name -ne 'Zip.bat' } | ForEach-Object { $r=$_.FullName.Substring($root.Length).TrimStart('\'); [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$_.FullName,$r,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null }; $archive.Dispose(); Write-Host ''; Write-Host 'ZIP CREATED SUCCESSFULLY!' -ForegroundColor Green; Write-Host $zip"

echo.

if exist "%~dp0Rentools.zip" (
    echo ========================================
    echo SUCCESS
    echo ========================================
    echo.
    echo Created:
    echo %~dp0Rentools.zip
    echo.
) else (
    echo ========================================
    echo FAILED
    echo ========================================
    echo.
    echo ZIP was not created.
    echo.
)

pause