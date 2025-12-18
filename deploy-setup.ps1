# Script di Setup per Deploy PizzaFlow Server
# Questo script prepara il progetto per il deploy su Railway/Render

Write-Host "🚀 Setup Deploy PizzaFlow Server" -ForegroundColor Cyan
Write-Host ""

# Verifica file necessari
Write-Host "📋 Verificando file necessari..." -ForegroundColor Yellow
$requiredFiles = @(
    "server/package.json",
    "server/src/server.js",
    "server/railway.json",
    "server/Dockerfile"
)

$allPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MANCANTE" -ForegroundColor Red
        $allPresent = $false
    }
}

if (-not $allPresent) {
    Write-Host ""
    Write-Host "❌ Alcuni file necessari mancano. Controlla la configurazione." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Tutti i file necessari sono presenti!" -ForegroundColor Green
Write-Host ""

# Verifica Git
Write-Host "🔍 Verificando repository Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "  ✅ Repository Git presente" -ForegroundColor Green
    
    # Verifica se ci sono commit
    $commitCount = (git rev-list --count HEAD 2>$null)
    if ($commitCount -gt 0) {
        Write-Host "  ✅ Repository ha $commitCount commit" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Nessun commit trovato" -ForegroundColor Yellow
        Write-Host "  💡 Esegui: git add . && git commit -m 'Initial commit'" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ⚠️  Repository Git non trovato" -ForegroundColor Yellow
    Write-Host "  💡 Inizializzando Git..." -ForegroundColor Cyan
    git init
    Write-Host "  ✅ Git inizializzato" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 PROSSIMI PASSI PER IL DEPLOY:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Assicurati che il progetto sia su GitHub:" -ForegroundColor White
Write-Host "   - Se non hai un repository GitHub, creane uno su github.com" -ForegroundColor Gray
Write-Host "   - Poi esegui: git remote add origin URL_REPO" -ForegroundColor Gray
Write-Host "   - E: git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Vai su Railway (https://railway.app):" -ForegroundColor White
Write-Host "   - Registrati/Login con GitHub" -ForegroundColor Gray
Write-Host "   - Clicca 'New Project' → 'Deploy from GitHub repo'" -ForegroundColor Gray
Write-Host "   - Seleziona il tuo repository" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configura il servizio:" -ForegroundColor White
Write-Host "   - Root Directory: server" -ForegroundColor Gray
Write-Host "   - Build Command: npm install" -ForegroundColor Gray
Write-Host "   - Start Command: npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Aggiungi variabili d'ambiente:" -ForegroundColor White
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "   - JWT_SECRET=<genera-un-secret-sicuro>" -ForegroundColor Gray
Write-Host "   - ALLOWED_ORIGINS=*" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Dopo il deploy, copia l URL e configura il frontend:" -ForegroundColor White
Write-Host "   - Crea file .env nella root con: VITE_API_URL=https://tuo-url.com/api" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Setup completato! Segui i passi sopra per deployare." -ForegroundColor Green

