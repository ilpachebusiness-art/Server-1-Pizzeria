# Script PowerShell per avviare tutte le applicazioni

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PizzaFlow - Avvio Applicazioni" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica che Node.js sia installato
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERRORE: Node.js non trovato!" -ForegroundColor Red
    Write-Host "Installa Node.js da https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/4] Installazione dipendenze server..." -ForegroundColor Cyan
Set-Location server
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "  Dipendenze già installate" -ForegroundColor Gray
}
Set-Location ..

Write-Host "`n[2/4] Installazione dipendenze app Customer..." -ForegroundColor Cyan
Set-Location apps/customer
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "  Dipendenze già installate" -ForegroundColor Gray
}
Set-Location ../..

Write-Host "`n[3/4] Installazione dipendenze app Admin..." -ForegroundColor Cyan
Set-Location apps/admin
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "  Dipendenze già installate" -ForegroundColor Gray
}
Set-Location ../..

Write-Host "`n[4/4] Installazione dipendenze app Rider..." -ForegroundColor Cyan
Set-Location apps/rider
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "  Dipendenze già installate" -ForegroundColor Gray
}
Set-Location ../..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Avvio Server e Applicazioni..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Customer App: http://localhost:5174" -ForegroundColor Yellow
Write-Host "Admin Panel: http://localhost:5175" -ForegroundColor Yellow
Write-Host "Rider App: http://localhost:5176" -ForegroundColor Yellow
Write-Host ""
Write-Host "Premi CTRL+C per fermare tutti i servizi" -ForegroundColor Gray
Write-Host ""

# Avvia server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
Start-Sleep -Seconds 3

# Avvia app in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/customer; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/admin; npm run dev"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/rider; npm run dev"

Write-Host "`nTutte le applicazioni sono state avviate!" -ForegroundColor Green
Write-Host "Apri i browser per accedere alle applicazioni." -ForegroundColor Cyan



