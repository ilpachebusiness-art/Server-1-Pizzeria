# Script per installare l'APK su Windows Subsystem for Android (WSA)

$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "ERRORE: APK non trovato!" -ForegroundColor Red
    Write-Host "Percorso atteso: $apkPath" -ForegroundColor Yellow
    Write-Host "`nEsegui prima: npm run build && npx cap sync android" -ForegroundColor Yellow
    exit 1
}

Write-Host "Verificando WSA..." -ForegroundColor Cyan

# Verifica se WSA è installato
$wsaPackage = Get-AppxPackage -Name "MicrosoftCorporationII.WindowsSubsystemForAndroid" -ErrorAction SilentlyContinue
if (-not $wsaPackage) {
    Write-Host "ERRORE: Windows Subsystem for Android non è installato!" -ForegroundColor Red
    Write-Host "Installa WSA dal Microsoft Store" -ForegroundColor Yellow
    exit 1
}

# Avvia WSA se non è in esecuzione
$wsaProcess = Get-Process -Name "WsaClient" -ErrorAction SilentlyContinue
if (-not $wsaProcess) {
    Write-Host "Avviando WSA..." -ForegroundColor Cyan
    Start-Process "shell:AppsFolder\MicrosoftCorporationII.WindowsSubsystemForAndroid_8wekyb3d8bbwe!App"
    Write-Host "Attendere che WSA si avvii completamente..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Verifica se ADB è disponibile
$adbPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
}

if (-not (Test-Path $adbPath)) {
    Write-Host "ERRORE: ADB non trovato!" -ForegroundColor Red
    Write-Host "Installa Android SDK Platform Tools o Android Studio" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nConnessione a WSA..." -ForegroundColor Cyan
Write-Host "IMPORTANTE: Assicurati che Developer Mode sia abilitato in WSA!" -ForegroundColor Yellow
Write-Host "1. Apri WSA dal menu Start" -ForegroundColor White
Write-Host "2. Vai in Impostazioni > Developer Mode" -ForegroundColor White
Write-Host "3. Attiva Developer Mode" -ForegroundColor White
Write-Host "`nPremi Invio quando Developer Mode è abilitato..." -ForegroundColor Cyan
Read-Host

# Disconnetti eventuali connessioni precedenti
& $adbPath disconnect 127.0.0.1:58526 2>$null

# Connessione a WSA (porta 58526 è la porta predefinita di WSA)
Write-Host "Tentativo di connessione a 127.0.0.1:58526..." -ForegroundColor Cyan
& $adbPath connect 127.0.0.1:58526

Start-Sleep -Seconds 3

# Verifica connessione
Write-Host "`nVerifica dispositivi connessi..." -ForegroundColor Cyan
$devices = & $adbPath devices
Write-Host $devices -ForegroundColor Gray

if ($devices -notmatch "127.0.0.1:58526.*device") {
    Write-Host "`nERRORE: Connessione fallita!" -ForegroundColor Red
    Write-Host "`nPossibili cause:" -ForegroundColor Yellow
    Write-Host "1. Developer Mode NON è abilitato in WSA" -ForegroundColor White
    Write-Host "2. WSA non è completamente avviato" -ForegroundColor White
    Write-Host "3. Porta ADB diversa (controlla nelle impostazioni WSA)" -ForegroundColor White
    Write-Host "`nConsulta CONFIGURARE_WSA.md per istruzioni dettagliate." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nInstallazione APK su WSA..." -ForegroundColor Cyan
$fullPath = (Resolve-Path $apkPath).Path
& $adbPath install -r $fullPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "APK installato con successo su WSA!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nPuoi trovare l'app nel menu Start o nella schermata WSA" -ForegroundColor Yellow
} else {
    Write-Host "`nERRORE: Installazione fallita!" -ForegroundColor Red
    Write-Host "Verifica che WSA sia completamente avviato e riprova." -ForegroundColor Yellow
}


