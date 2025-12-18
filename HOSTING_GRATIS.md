# 🆓 Hosting Completamente Gratuito per PizzaFlow Server

## 🎯 Opzioni Completamente Gratuite

### 1. Render (Consigliato - Gratuito Forever) ⭐

**Vantaggi:**
- ✅ Completamente gratuito
- ✅ Supporta WebSocket
- ✅ HTTPS incluso
- ✅ Deploy automatico da GitHub
- ✅ Nessun limite di tempo (gratis forever)

**Limiti:**
- ⚠️ Il servizio va in "sleep" dopo 15 minuti di inattività
- ⚠️ Il primo avvio dopo sleep può richiedere 30-60 secondi
- ⚠️ 750 ore gratuite al mese (più che sufficienti)

**Setup:**
1. Vai su: https://render.com
2. Registrati con GitHub (gratis)
3. New → Web Service
4. Connetti repository: `ilpachebusiness-art/Server-1-Pizzeria`
5. Configura:
   - **Name**: `pizzaflow-server`
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Variabili d'ambiente:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
   ALLOWED_ORIGINS=*
   ```
7. Plan: **Free**
8. Deploy!

**URL tipo:** `https://pizzaflow-server.onrender.com`

---

### 2. Fly.io (Gratuito con Limiti Generosi)

**Vantaggi:**
- ✅ 3 VM gratuite
- ✅ 160GB di traffico al mese
- ✅ Supporta WebSocket
- ✅ Nessun sleep (sempre attivo)

**Limiti:**
- ⚠️ 256MB RAM per VM gratuita
- ⚠️ Richiede CLI per setup iniziale

**Setup:**
1. Installa Fly CLI:
   ```powershell
   iwr https://fly.io/install.ps1 -useb | iex
   ```
2. Login:
   ```powershell
   fly auth login
   ```
3. Nel progetto:
   ```powershell
   cd server
   fly launch
   ```
4. Segui le istruzioni
5. Aggiungi variabili:
   ```powershell
   fly secrets set JWT_SECRET="SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M="
   fly secrets set NODE_ENV="production"
   fly secrets set ALLOWED_ORIGINS="*"
   ```

---

### 3. Koyeb (Gratuito)

**Vantaggi:**
- ✅ Completamente gratuito
- ✅ Deploy da GitHub
- ✅ Supporta WebSocket
- ✅ HTTPS incluso

**Limiti:**
- ⚠️ Sleep dopo inattività
- ⚠️ Limiti di risorse

**Setup:**
1. Vai su: https://www.koyeb.com
2. Registrati con GitHub
3. Create App → GitHub
4. Seleziona repository
5. Configura come Render

---

### 4. Cyclic.sh (Completamente Gratuito)

**Vantaggi:**
- ✅ Gratuito forever
- ✅ Nessun sleep
- ✅ Deploy automatico

**Setup:**
1. Vai su: https://www.cyclic.sh
2. Connetti GitHub
3. Seleziona repository
4. Deploy automatico

---

## 🏆 Raccomandazione: Render

**Perché Render:**
- ✅ Setup più semplice (tutto via web)
- ✅ Piano gratuito stabile
- ✅ Supporto WebSocket
- ✅ Documentazione chiara
- ✅ Nessuna carta di credito richiesta

**Nota sul "Sleep":**
- Il servizio va in sleep dopo 15 minuti di inattività
- Il primo avvio dopo sleep richiede 30-60 secondi
- Per evitare sleep, puoi usare un servizio di "ping" gratuito come:
  - https://uptimerobot.com (gratis, ping ogni 5 minuti)
  - https://cron-job.org (gratis, ping ogni 5 minuti)

---

## 📋 Quick Setup Render (5 minuti)

1. **Vai su:** https://render.com
2. **Registrati** con GitHub (gratis, no carta)
3. **New** → **Web Service**
4. **Connetti GitHub** → Seleziona `ilpachebusiness-art/Server-1-Pizzeria`
5. **Configura:**
   - Name: `pizzaflow-server`
   - Environment: `Node`
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
   - Plan: **Free**
6. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
   ALLOWED_ORIGINS=*
   ```
7. **Create Web Service**
8. **Attendi deploy** (2-3 minuti)
9. **Copia l'URL** (tipo: `https://pizzaflow-server.onrender.com`)

---

## 🔧 Configura Frontend

Dopo il deploy, crea `.env` nella root:
```env
VITE_API_URL=https://pizzaflow-server.onrender.com/api
```

---

## ⚡ Evitare Sleep (Opzionale)

Per mantenere il server sempre attivo, configura un ping automatico:

### UptimeRobot (Gratis)
1. Vai su: https://uptimerobot.com
2. Registrati (gratis)
3. Add New Monitor
4. Monitor Type: **HTTP(s)**
5. URL: `https://pizzaflow-server.onrender.com/health`
6. Interval: **5 minutes**
7. Save

Il server rimarrà sempre attivo! ✅

---

## ✅ Verifica

Testa:
```bash
curl https://pizzaflow-server.onrender.com/health
```

Dovresti ricevere:
```json
{"status":"ok","timestamp":"..."}
```

---

## 🎉 Fatto!

Il server è ora:
- ✅ Completamente gratuito
- ✅ Sempre online (con ping automatico)
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Con WebSocket funzionante

