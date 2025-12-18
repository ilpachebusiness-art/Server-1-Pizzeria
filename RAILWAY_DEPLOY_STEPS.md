# 🚀 Passi per Deploy su Railway

## ✅ Step 1: Codice su GitHub (COMPLETATO)
- Repository: https://github.com/ilpachebusiness-art/Server-1-Pizzeria.git
- Branch: main
- Status: ✅ Push completato

## 📋 Step 2: Deploy su Railway

### 1. Accedi a Railway
- Vai su: **https://railway.app/new**
- Registrati/Login con GitHub

### 2. Crea Nuovo Progetto
- Clicca su **"New Project"**
- Seleziona **"Deploy from GitHub repo"**
- Autorizza Railway ad accedere a GitHub (se richiesto)

### 3. Seleziona Repository
- Cerca e seleziona: **ilpachebusiness-art/Server-1-Pizzeria**

### 4. Configura il Servizio
Railway dovrebbe rilevare automaticamente la configurazione. Se non lo fa:

- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 5. Configura Variabili d'Ambiente
Vai su **Settings** → **Variables** e aggiungi:

```
NODE_ENV=production
JWT_SECRET=<genera-un-secret-sicuro>
ALLOWED_ORIGINS=*
```

**Per generare JWT_SECRET sicuro (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 6. Deploy
- Railway deployerà automaticamente
- Attendi che il deploy completi (circa 2-3 minuti)
- Verifica i log per eventuali errori

### 7. Ottieni l'URL del Server
- Vai su **Settings** → **Domains**
- Railway fornisce automaticamente un dominio HTTPS
- Copia l'URL (es: `https://pizzaflow-server-production.up.railway.app`)

## 📱 Step 3: Configura Frontend

Dopo aver ottenuto l'URL del server:

1. Crea un file `.env` nella root del progetto:
```env
VITE_API_URL=https://tuo-url-railway.com/api
```

2. Riavvia le app frontend per caricare la nuova configurazione

## ✅ Verifica

1. Testa l'endpoint health check:
   ```
   https://tuo-url-railway.com/health
   ```
   Dovresti ricevere: `{"status":"ok","timestamp":"..."}`

2. Testa un endpoint API:
   ```
   https://tuo-url-railway.com/api/menu/items
   ```

3. Apri l'app frontend e verifica che si connetta al server cloud

## 🎉 Fatto!

Il server è ora:
- ✅ Sempre online
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Con supporto WebSocket per aggiornamenti live
- ✅ Non richiede che il tuo computer sia acceso

## 🆘 Troubleshooting

### Server non si avvia
- Controlla i log in Railway Dashboard
- Verifica che tutte le variabili d'ambiente siano configurate
- Assicurati che `PORT` non sia necessario (Railway lo imposta automaticamente)

### Errori CORS
- Verifica che `ALLOWED_ORIGINS=*` sia impostato
- Controlla che il frontend usi l'URL corretto

### WebSocket non funziona
- Verifica che l'URL WebSocket usi `wss://` (non `ws://`)
- Controlla i log per errori di connessione

