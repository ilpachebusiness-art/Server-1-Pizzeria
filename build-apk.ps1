# Script PowerShell per generare l'APK
Write-Host "Configurando Java..." -ForegroundColor Cyan
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "`nVerificando Java..." -ForegroundColor Cyan
java -version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRORE: Java non trovato!" -ForegroundColor Red
    Write-Host "Assicurati che Java sia installato correttamente."
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host "`nCostruendo l'app web..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRORE: Build dell'app web fallita!" -ForegroundColor Red
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host "`nSincronizzando con Capacitor..." -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRORE: Sincronizzazione fallita!" -ForegroundColor Red
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host "`nGenerando APK (questo potrebbe richiedere alcuni minuti)..." -ForegroundColor Cyan
Set-Location android
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRORE: Generazione APK fallita!" -ForegroundColor Red
    Set-Location ..
    Read-Host "Premi Invio per uscire"
    exit 1
}

Set-Location ..
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "APK generato con successo!" -ForegroundColor Green
Write-Host ""
Write-Host "L'APK si trova in:" -ForegroundColor Yellow
Write-Host "android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Read-Host "Premi Invio per uscire"

