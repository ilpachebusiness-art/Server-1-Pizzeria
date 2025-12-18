# ✅ Cosa Fare Dopo il Deploy su Render

## 1. Verifica il Deploy

### Controlla lo Stato
1. Vai sulla **dashboard Render**
2. Clicca sul tuo servizio `Server1Pizzeria`
3. Verifica lo stato:
   - ✅ **Live** (verde) = Server online!
   - ⏳ **Building** = Sta compilando (attendi 2-3 minuti)
   - ⏳ **Deploying** = Sta deployando (attendi 1-2 minuti)
   - ❌ **Failed** = C'è un errore (controlla i log)

### Controlla i Log
1. Clicca su **Logs** tab
2. Dovresti vedere:
   ```
   🚀 Starting PizzaFlow Server...
   📦 Environment: production
   🔌 Port: 10000
   ✅ Data files initialized
   ✅ Stores loaded
   ✅ ============================================
   🚀 PizzaFlow Server running on port 10000
   📡 Health check: http://0.0.0.0:10000/health
   🔌 WebSocket server: ws://0.0.0.0:10000/ws
   ✅ ============================================
   ```

---

## 2. Ottieni l'URL del Server

1. Nella dashboard Render, vedrai l'URL del servizio
2. Tipo: `https://server1pizzeria.onrender.com`
3. **Copia questo URL** - ti servirà per il frontend

---

## 3. Testa il Server

### Test Health Check
Apri nel browser:
```
https://tuo-url.onrender.com/health
```

Dovresti ricevere:
```json
{"status":"ok","timestamp":"2025-01-18T..."}
```

### Test API Endpoint
Prova:
```
https://tuo-url.onrender.com/api/menu/items
```

Dovresti ricevere un array (vuoto o con dati).

---

## 4. Configura il Frontend

### Crea File .env
Nella **root del progetto** (non in `server/`), crea un file `.env`:

```env
VITE_API_URL=https://tuo-url.onrender.com/api
```

**Sostituisci `tuo-url.onrender.com` con il tuo URL reale!**

### Esempio
Se il tuo URL è `https://server1pizzeria.onrender.com`, il file `.env` sarà:
```env
VITE_API_URL=https://server1pizzeria.onrender.com/api
```

### Riavvia le App Frontend
Dopo aver creato/modificato `.env`, riavvia le app:
```powershell
# Se stai usando npm
npm run dev

# Oppure riavvia il processo se già in esecuzione
```

---

## 5. Verifica la Connessione

1. Apri l'app frontend (customer/admin/rider)
2. Apri la console del browser (F12)
3. Dovresti vedere richieste al server Render invece di localhost
4. Verifica che i dati si carichino correttamente

---

## 6. Nota sul "Sleep" di Render

⚠️ **Importante:** I servizi gratuiti di Render vanno in "sleep" dopo 15 minuti di inattività.

### Cosa significa:
- Il server si spegne dopo 15 minuti senza richieste
- Il primo avvio dopo sleep richiede 30-60 secondi
- Dopo il primo avvio, funziona normalmente

### Soluzione: Ping Automatico (Opzionale)

Per mantenere il server sempre attivo, configura un ping automatico:

#### UptimeRobot (Gratis)
1. Vai su: https://uptimerobot.com
2. Registrati (gratis, no carta)
3. **Add New Monitor**
4. Configura:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: PizzaFlow Server
   - **URL**: `https://tuo-url.onrender.com/health`
   - **Monitoring Interval**: 5 minutes
5. **Save**

Il server rimarrà sempre attivo! ✅

---

## ✅ Checklist Completa

- [ ] Server è "Live" su Render
- [ ] Log mostrano "Server running"
- [ ] Health check funziona (`/health`)
- [ ] URL del server copiato
- [ ] File `.env` creato nella root
- [ ] `VITE_API_URL` configurato correttamente
- [ ] Frontend riavviato
- [ ] App si connette al server cloud
- [ ] (Opzionale) Ping automatico configurato

---

## 🆘 Problemi Comuni

### Server non si avvia
- Controlla i log per errori
- Verifica che tutte le variabili d'ambiente siano corrette
- Assicurati che `package.json` sia nella cartella `server`

### Frontend non si connette
- Verifica che `.env` sia nella root (non in `server/`)
- Controlla che l'URL sia corretto (con `/api` alla fine)
- Riavvia il frontend dopo aver modificato `.env`
- Controlla la console del browser per errori CORS

### Server va in sleep
- Normale per il piano gratuito
- Configura ping automatico con UptimeRobot
- Oppure accetta il delay di 30-60 secondi al primo avvio

---

## 🎉 Fatto!

Il server è ora:
- ✅ Online e accessibile
- ✅ Gratuito
- ✅ Funzionante da qualsiasi dispositivo
- ✅ Con WebSocket per aggiornamenti live

