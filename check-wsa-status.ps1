# Script per verificare lo stato di WSA e ADB

Write-Host "=== Verifica stato WSA e ADB ===" -ForegroundColor Cyan
Write-Host ""

# Verifica se WSA è installato
Write-Host "[1/4] Verifica installazione WSA..." -ForegroundColor Cyan
$wsaPackage = Get-AppxPackage -Name "MicrosoftCorporationII.WindowsSubsystemForAndroid" -ErrorAction SilentlyContinue
if ($wsaPackage) {
    Write-Host "  ✓ WSA installato (Versione: $($wsaPackage.Version))" -ForegroundColor Green
} else {
    Write-Host "  ✗ WSA non installato!" -ForegroundColor Red
    Write-Host "  Installa WSA dal Microsoft Store" -ForegroundColor Yellow
    exit 1
}

# Verifica se WSA è in esecuzione
Write-Host "`n[2/4] Verifica processo WSA..." -ForegroundColor Cyan
$wsaProcess = Get-Process -Name "WsaClient" -ErrorAction SilentlyContinue
if ($wsaProcess) {
    Write-Host "  ✓ WSA è in esecuzione (PID: $($wsaProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "  ⚠ WSA non è in esecuzione" -ForegroundColor Yellow
    Write-Host "  Avvia WSA dal menu Start" -ForegroundColor Yellow
}

# Verifica ADB
Write-Host "`n[3/4] Verifica ADB..." -ForegroundColor Cyan
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\platform-tools\adb.exe"
}

if (Test-Path $adbPath) {
    Write-Host "  ✓ ADB trovato: $adbPath" -ForegroundColor Green
    
    # Verifica versione ADB
    $adbVersion = & $adbPath version 2>$null
    Write-Host "  Versione: $($adbVersion[0])" -ForegroundColor Gray
    
    # Verifica dispositivi connessi
    Write-Host "`n[4/4] Verifica dispositivi ADB..." -ForegroundColor Cyan
    $devices = & $adbPath devices 2>$null
    Write-Host $devices -ForegroundColor Gray
    
    if ($devices -match "127.0.0.1:58526.*device") {
        Write-Host "`n  ✓ Connessione WSA attiva!" -ForegroundColor Green
    } else {
        Write-Host "`n  ✗ Nessuna connessione a WSA" -ForegroundColor Red
        Write-Host "`n  Azioni richieste:" -ForegroundColor Yellow
        Write-Host "  1. Avvia WSA dal menu Start" -ForegroundColor White
        Write-Host "  2. Abilita Developer Mode in WSA (Impostazioni > Developer Mode)" -ForegroundColor White
        Write-Host "  3. Esegui: .\install-apk-wsa.ps1" -ForegroundColor White
    }
} else {
    Write-Host "  ✗ ADB non trovato!" -ForegroundColor Red
    Write-Host "  Installa Android SDK Platform Tools o Android Studio" -ForegroundColor Yellow
}

Write-Host "`n=== Fine verifica ===" -ForegroundColor Cyan



