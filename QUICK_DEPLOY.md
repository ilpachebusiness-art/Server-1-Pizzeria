# 🚀 Deploy Rapido - PizzaFlow Server

## Opzione 1: Railway (5 minuti - Consigliato)

1. **Vai su https://railway.app** e registrati con GitHub

2. **Crea nuovo progetto** → "Deploy from GitHub repo"

3. **Seleziona il repository** `magicpath-project`

4. **Configura il servizio:**
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. **Aggiungi variabili d'ambiente:**
   ```
   NODE_ENV=production
   JWT_SECRET=genera-un-secret-sicuro-qui
   ALLOWED_ORIGINS=*
   ```

6. **Deploy!** Railway ti darà un URL tipo: `https://pizzaflow-server-production.up.railway.app`

7. **Configura il frontend:**
   - Crea file `.env` nella root del progetto:
     ```
     VITE_API_URL=https://tuo-url-railway.com/api
     ```

## Opzione 2: Render (Alternativa)

1. Vai su https://render.com
2. New → Web Service
3. Connetti repository GitHub
4. Configura:
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
5. Aggiungi variabili d'ambiente (stesse di Railway)
6. Deploy!

## ✅ Dopo il Deploy

1. **Copia l'URL del server** (es: `https://pizzaflow-server-production.up.railway.app`)

2. **Crea file `.env` nella root del progetto:**
   ```env
   VITE_API_URL=https://tuo-url-server.com/api
   ```

3. **Riavvia le app frontend** per caricare la nuova configurazione

4. **Testa:**
   - Apri l'app in un browser
   - Dovrebbe connettersi al server cloud
   - Gli aggiornamenti live funzioneranno via WebSocket

## 🔒 Genera JWT_SECRET Sicuro

```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

## 📱 Accesso da Altri Dispositivi

Una volta deployato, qualsiasi dispositivo può accedere al server usando l'URL cloud. Non serve più che il tuo computer sia acceso!

---

**Per dettagli completi, vedi `DEPLOY.md`**

