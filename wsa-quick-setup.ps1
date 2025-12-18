# Script interattivo per configurare WSA e installare l'APK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup WSA e Installazione APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Verifica WSA installato
Write-Host "[Passo 1/5] Verifica installazione WSA..." -ForegroundColor Cyan
$wsaPackage = Get-AppxPackage -Name "MicrosoftCorporationII.WindowsSubsystemForAndroid" -ErrorAction SilentlyContinue
if (-not $wsaPackage) {
    Write-Host "  ✗ WSA non installato!" -ForegroundColor Red
    Write-Host "  Installa WSA dal Microsoft Store e riprova." -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ WSA installato" -ForegroundColor Green

# Passo 2: Avvia WSA
Write-Host "`n[Passo 2/5] Avvio WSA..." -ForegroundColor Cyan
$wsaProcess = Get-Process -Name "WsaClient" -ErrorAction SilentlyContinue
if (-not $wsaProcess) {
    Write-Host "  Avvio WSA..." -ForegroundColor Yellow
    Start-Process "shell:AppsFolder\MicrosoftCorporationII.WindowsSubsystemForAndroid_8wekyb3d8bbwe!App"
    Write-Host "  Attendi che WSA si apra completamente..." -ForegroundColor Yellow
    Write-Host "  (Questo può richiedere 30-60 secondi)" -ForegroundColor Gray
} else {
    Write-Host "  ✓ WSA già in esecuzione" -ForegroundColor Green
}

# Passo 3: Istruzioni per Developer Mode
Write-Host "`n[Passo 3/5] Configurazione Developer Mode" -ForegroundColor Cyan
Write-Host "`n  IMPORTANTE: Devi abilitare Developer Mode manualmente in WSA!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Segui questi passaggi:" -ForegroundColor White
Write-Host "  1. Nella finestra WSA che si è appena aperta," -ForegroundColor Gray
Write-Host "  2. Clicca sull'icona ⚙️ (Impostazioni) o cerca 'Settings'" -ForegroundColor Gray
Write-Host "  3. Scorri fino a trovare 'Developer Mode' o 'Modalità sviluppatore'" -ForegroundColor Gray
Write-Host "  4. Attiva l'interruttore accanto a Developer Mode" -ForegroundColor Gray
Write-Host "  5. Annota il numero di porta ADB (solitamente 58526)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Consulta GUIDA_DEVELOPER_MODE_WSA.md per istruzioni dettagliate." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Premi INVIO quando hai abilitato Developer Mode..." -ForegroundColor Yellow
Read-Host

# Passo 4: Verifica ADB
Write-Host "`n[Passo 4/5] Verifica ADB..." -ForegroundColor Cyan
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\platform-tools\adb.exe"
}

if (-not (Test-Path $adbPath)) {
    Write-Host "  ✗ ADB non trovato!" -ForegroundColor Red
    Write-Host "  Installa Android SDK Platform Tools o Android Studio" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ ADB trovato" -ForegroundColor Green

# Passo 5: Connessione e installazione
Write-Host "`n[Passo 5/5] Connessione a WSA e installazione APK..." -ForegroundColor Cyan

# Chiedi la porta ADB
Write-Host "`n  Inserisci la porta ADB da WSA (premi INVIO per usare 58526): " -ForegroundColor Yellow -NoNewline
$port = Read-Host
if ([string]::IsNullOrWhiteSpace($port)) {
    $port = "58526"
}

# Disconnetti eventuali connessioni precedenti
& $adbPath disconnect 127.0.0.1:$port 2>$null

# Connetti
Write-Host "`n  Connessione a 127.0.0.1:$port..." -ForegroundColor Cyan
& $adbPath connect 127.0.0.1:$port

Start-Sleep -Seconds 3

# Verifica connessione
$devices = & $adbPath devices
Write-Host "`n  Dispositivi connessi:" -ForegroundColor Cyan
Write-Host $devices -ForegroundColor Gray

if ($devices -notmatch "127.0.0.1:$port.*device") {
    Write-Host "`n  ✗ Connessione fallita!" -ForegroundColor Red
    Write-Host "`n  Possibili cause:" -ForegroundColor Yellow
    Write-Host "  - Developer Mode non è abilitato in WSA" -ForegroundColor White
    Write-Host "  - Porta ADB errata (controlla nelle impostazioni WSA)" -ForegroundColor White
    Write-Host "  - WSA non è completamente avviato" -ForegroundColor White
    Write-Host "`n  Riprova dopo aver verificato Developer Mode." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✓ Connessione riuscita!" -ForegroundColor Green

# Verifica APK
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "`n  ✗ APK non trovato!" -ForegroundColor Red
    Write-Host "  Esegui prima: npm run build && npx cap sync android" -ForegroundColor Yellow
    exit 1
}

# Installa APK
Write-Host "`n  Installazione APK..." -ForegroundColor Cyan
$fullPath = (Resolve-Path $apkPath).Path
& $adbPath install -r $fullPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✓ APK installato con successo!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nPuoi trovare l'app nel menu Start o nella schermata WSA" -ForegroundColor Yellow
} else {
    Write-Host "`n  ✗ Installazione fallita!" -ForegroundColor Red
    Write-Host "  Verifica che WSA sia completamente avviato e riprova." -ForegroundColor Yellow
}

Write-Host "`nPremi INVIO per uscire..." -ForegroundColor Gray
Read-Host



