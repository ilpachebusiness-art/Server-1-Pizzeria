# Script per riavviare tutti i server e le applicazioni

Write-Host "Fermando tutti i processi Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Avviando il server backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Avviando App Cliente (Mobile)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\apps\customer'; npm run dev -- --host --port 5174"

Start-Sleep -Seconds 1

Write-Host "Avviando App Fattorino (Mobile)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\apps\rider'; npm run dev -- --host --port 5176"

Start-Sleep -Seconds 1

Write-Host "Avviando App Admin (Desktop)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\apps\admin'; npm run dev -- --host --port 5175"

Start-Sleep -Seconds 5

Write-Host "Verificando che tutti i server siano attivi..." -ForegroundColor Cyan
$ports = @(3001, 5174, 5175, 5176)
foreach ($port in $ports) {
    $listening = netstat -ano | findstr ":$port" | findstr "LISTENING"
    if ($listening) {
        Write-Host "  [OK] Porta $port ATTIVA" -ForegroundColor Green
    } else {
        Write-Host "  [X] Porta $port NON ATTIVA" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Aprendo le applicazioni nel browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:5174"
Start-Sleep -Seconds 1
Start-Process "http://localhost:5176"
Start-Sleep -Seconds 1
Start-Process "http://localhost:5175"

Write-Host ""
Write-Host "Tutto pronto!" -ForegroundColor Green
Write-Host "  - App Cliente: http://localhost:5174 (Modalita Mobile - F12 poi Ctrl+Shift+M)" -ForegroundColor White
Write-Host "  - App Fattorino: http://localhost:5176 (Modalita Mobile - F12 poi Ctrl+Shift+M)" -ForegroundColor White
Write-Host "  - App Admin: http://localhost:5175 (Desktop)" -ForegroundColor White
