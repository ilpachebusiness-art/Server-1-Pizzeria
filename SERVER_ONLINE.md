# ✅ Server Online su Render!

## 🎉 Stato Attuale

- **URL Server**: https://server1pizzeria.onrender.com
- **Status**: Live ✅
- **Port**: 10000
- **Piano**: Free (gratuito)

## ✅ Configurazione Completata

### Frontend
- File `.env` creato nella root del progetto
- Configurato: `VITE_API_URL=https://server1pizzeria.onrender.com/api`

### Server
- ✅ Tutti i file di dati inizializzati
- ✅ Server in ascolto sulla porta 10000
- ✅ WebSocket configurato
- ✅ Health check funzionante

---

## 📋 Prossimi Passi

### 1. Riavvia le App Frontend

Le app devono essere riavviate per caricare il nuovo `.env`:

```powershell
# Ferma le app in esecuzione (Ctrl+C se stanno girando)

# Poi riavvia:
npm run dev
```

### 2. Testa le App

1. Apri l'app customer/admin/rider
2. Apri la console del browser (F12)
3. Verifica che le richieste vadano a:
   - `https://server1pizzeria.onrender.com/api/...`
   - Invece di `http://localhost:3001/api/...`

### 3. Verifica Connessione

Testa manualmente:
```
https://server1pizzeria.onrender.com/health
```

Dovresti vedere:
```json
{"status":"ok","timestamp":"2025-12-18T..."}
```

---

## ⚠️ Nota sul "Sleep" di Render

Il server va in "sleep" dopo 15 minuti di inattività.

### Cosa significa:
- Dopo 15 minuti senza richieste, il server si spegne
- Il primo avvio dopo sleep richiede 30-60 secondi
- Dopo il primo avvio, funziona normalmente

### Soluzione: Ping Automatico (Consigliato)

Per mantenere il server sempre attivo:

#### UptimeRobot (Gratis)
1. Vai su: https://uptimerobot.com
2. Registrati (gratis, no carta)
3. **Add New Monitor**
4. Configura:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: PizzaFlow Server
   - **URL**: `https://server1pizzeria.onrender.com/health`
   - **Monitoring Interval**: 5 minutes
5. **Save**

Il server rimarrà sempre attivo! ✅

---

## 🔧 Troubleshooting

### App non si connette al server
1. Verifica che `.env` sia nella **root** (non in `server/`)
2. Verifica che contenga: `VITE_API_URL=https://server1pizzeria.onrender.com/api`
3. **Riavvia** le app frontend (importante!)
4. Controlla la console del browser per errori

### Server non risponde
- Se è in sleep, attendi 30-60 secondi al primo avvio
- Verifica che il servizio sia "Live" su Render
- Controlla i log su Render per errori

### Errori CORS
- Verifica che `ALLOWED_ORIGINS=*` sia impostato su Render
- Controlla che l'URL nel frontend sia corretto

---

## ✅ Checklist Finale

- [x] Server deployato su Render
- [x] Server "Live" e funzionante
- [x] File `.env` creato
- [x] `VITE_API_URL` configurato
- [ ] App frontend riavviate
- [ ] App si connettono al server cloud
- [ ] (Opzionale) Ping automatico configurato

---

## 🎉 Fatto!

Il server è ora:
- ✅ Online e accessibile
- ✅ Gratuito
- ✅ Funzionante da qualsiasi dispositivo
- ✅ Con WebSocket per aggiornamenti live
- ✅ Non richiede computer acceso

**URL Server**: https://server1pizzeria.onrender.com  
**Health Check**: https://server1pizzeria.onrender.com/health

