# Script per abilitare Hyper-V e le funzionalità di virtualizzazione
# DEVE essere eseguito come Amministratore

Write-Host "Verificando privilegi di amministratore..." -ForegroundColor Cyan

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERRORE: Questo script deve essere eseguito come Amministratore!" -ForegroundColor Red
    Write-Host "`nCome procedere:" -ForegroundColor Yellow
    Write-Host "1. Clicca destro su PowerShell" -ForegroundColor White
    Write-Host "2. Seleziona 'Esegui come amministratore'" -ForegroundColor White
    Write-Host "3. Naviga alla cartella del progetto" -ForegroundColor White
    Write-Host "4. Esegui: .\enable-hyperv.ps1" -ForegroundColor White
    Read-Host "`nPremi Invio per uscire"
    exit 1
}

Write-Host "Privilegi OK`n" -ForegroundColor Green

Write-Host "Abilitazione funzionalità di virtualizzazione..." -ForegroundColor Cyan
Write-Host "Questo potrebbe richiedere alcuni minuti...`n" -ForegroundColor Yellow

try {
    Write-Host "[1/3] Abilitazione Hyper-V..." -ForegroundColor Cyan
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart | Out-Null
    
    Write-Host "[2/3] Abilitazione Piattaforma di virtualizzazione..." -ForegroundColor Cyan
    Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart | Out-Null
    
    Write-Host "[3/3] Abilitazione Windows Hypervisor Platform..." -ForegroundColor Cyan
    Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -All -NoRestart | Out-Null
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Funzionalità abilitate con successo!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nIMPORTANTE: Devi riavviare il computer per completare l'installazione." -ForegroundColor Yellow
    Write-Host "`nVuoi riavviare ora? (S/N)" -ForegroundColor Cyan
    
    $risposta = Read-Host
    if ($risposta -eq "S" -or $risposta -eq "s") {
        Write-Host "`nRiavvio del computer in 10 secondi..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        Restart-Computer
    } else {
        Write-Host "`nRicorda di riavviare il computer manualmente prima di usare WSA." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`nERRORE durante l'abilitazione:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "`nPremi Invio per uscire"
    exit 1
}




