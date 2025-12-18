# 🔧 Fix Errori Render - Configurazione Corretta

## ❌ Errori Comuni

### 1. Build/Start Command Sbagliati
**ERRATO:**
```
Build Command: server/ $ npm install
Start Command: server/ $ npm start
```

**CORRETTO:**
```
Build Command: npm install
Start Command: npm start
```

**Perché:** Render entra già nella Root Directory (`server`), quindi non serve specificare il path.

---

### 2. Variabile PORT Duplicata
**ERRATO:**
- PORT impostata manualmente (Render la imposta automaticamente)

**CORRETTO:**
- **RIMUOVI** la variabile PORT
- Render imposta automaticamente `PORT=10000` per i servizi gratuiti

---

### 3. Variabili d'Ambiente Corrette

Mantieni solo queste:
```
NODE_ENV=production
JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
ALLOWED_ORIGINS=*
```

**NON aggiungere PORT** - Render lo imposta automaticamente!

---

## ✅ Configurazione Corretta Completa

### Basic Settings
- **Name**: `Server1Pizzeria` (o qualsiasi nome)
- **Language**: `Node`
- **Branch**: `main`
- **Region**: `Virginia (US East)` (o la più vicina a te)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### Environment Variables
Rimuovi tutte le variabili e aggiungi solo queste:

1. **NODE_ENV**
   - Value: `production`

2. **JWT_SECRET**
   - Value: `SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=`

3. **ALLOWED_ORIGINS**
   - Value: `*`

**IMPORTANTE:** NON aggiungere PORT - Render lo imposta automaticamente!

---

## 🔄 Come Correggere

1. **Rimuovi le variabili d'ambiente duplicate:**
   - Clicca sulla X accanto a ogni variabile PORT
   - Lascia solo NODE_ENV, JWT_SECRET, ALLOWED_ORIGINS

2. **Correggi Build Command:**
   - Cambia da: `server/ $ npm install`
   - A: `npm install`

3. **Correggi Start Command:**
   - Cambia da: `server/ $ npm start`
   - A: `npm start`

4. **Verifica Root Directory:**
   - Deve essere: `server` (senza slash finale)

5. **Clicca "Deploy web service"**

---

## ✅ Checklist Pre-Deploy

- [ ] Root Directory: `server` (senza slash)
- [ ] Build Command: `npm install` (senza `server/ $`)
- [ ] Start Command: `npm start` (senza `server/ $`)
- [ ] Instance Type: `Free`
- [ ] Variabili d'ambiente:
  - [ ] NODE_ENV=production
  - [ ] JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
  - [ ] ALLOWED_ORIGINS=*
  - [ ] **NON c'è PORT** (Render lo imposta automaticamente)

---

## 🎯 Dopo il Deploy

1. Attendi 2-3 minuti per il deploy
2. Controlla i log per eventuali errori
3. Testa: `https://tuo-nome.onrender.com/health`
4. Dovresti ricevere: `{"status":"ok","timestamp":"..."}`

---

## 🆘 Se Ancora Non Funziona

1. **Controlla i log** nella dashboard Render
2. **Verifica** che tutti i file siano nel repository GitHub
3. **Assicurati** che `package.json` sia nella cartella `server`
4. **Verifica** che `server/src/server.js` esista

