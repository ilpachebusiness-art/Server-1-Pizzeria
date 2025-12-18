# 🔧 Risoluzione: Server Offline su Railway

## Problema
Railway mostra "server is offline" dopo il deploy.

## 🔍 Diagnostica

### 1. Controlla i Log
In Railway Dashboard:
1. Vai su **Deployments** → Clicca sul deployment più recente
2. Vai su **Logs** tab
3. Cerca errori in rosso

**Errori comuni:**
- `Cannot find module` → Dipendenze non installate
- `EADDRINUSE` → Porta già in uso
- `ENOENT` → File o directory mancante
- `SyntaxError` → Errore nel codice

### 2. Verifica Variabili d'Ambiente
Assicurati di avere:
```
NODE_ENV=production
JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
ALLOWED_ORIGINS=*
```

**IMPORTANTE:** NON aggiungere `PORT` - Railway lo imposta automaticamente!

### 3. Verifica Configurazione Build
In Railway Settings → Service:
- **Root Directory**: `server` ✅
- **Build Command**: `npm install` ✅
- **Start Command**: `npm start` ✅

## ✅ Soluzioni

### Soluzione 1: Rebuild e Redeploy
1. Vai su **Deployments**
2. Clicca sui **3 puntini** → **Redeploy**
3. Attendi che il build completi
4. Controlla i log per errori

### Soluzione 2: Verifica Dipendenze
Se vedi errori `Cannot find module`:

1. Vai su **Settings** → **Variables**
2. Aggiungi (temporaneamente per debug):
   ```
   NPM_CONFIG_LOGLEVEL=verbose
   ```
3. Redeploy
4. Controlla i log per vedere quali moduli mancano

### Soluzione 3: Fix Cartella Data
Il server crea una cartella `data/` per la persistenza. Railway potrebbe avere problemi.

**Fix temporaneo:**
1. Aggiungi variabile d'ambiente:
   ```
   DATA_DIR=/tmp/data
   ```
2. Oppure modifica il codice per usare memoria temporanea

### Soluzione 4: Verifica Porta
Il server usa `process.env.PORT || 3001`. Railway imposta automaticamente `PORT`.

**Verifica:**
- NON aggiungere `PORT` manualmente
- Il server dovrebbe usare la porta che Railway fornisce

### Soluzione 5: Test Locale
Testa il server localmente prima di deployare:

```powershell
cd server
npm install
npm start
```

Se funziona localmente ma non su Railway, è un problema di configurazione Railway.

## 🐛 Errori Specifici

### "Cannot find module './models/stores.js'"
**Causa:** Path relativi non risolti correttamente
**Fix:** Verifica che tutti i file esistano nel repository

### "EADDRINUSE: address already in use"
**Causa:** Porta già in uso
**Fix:** NON impostare PORT manualmente, lascia che Railway lo faccia

### "ENOENT: no such file or directory 'data'"
**Causa:** Cartella data non creata
**Fix:** Il codice dovrebbe crearla automaticamente, ma aggiungi:
```
DATA_DIR=/tmp/data
```

### "SyntaxError: Unexpected token"
**Causa:** Errore di sintassi nel codice
**Fix:** Controlla i log per vedere quale file ha l'errore

## 📋 Checklist Pre-Deploy

- [ ] `package.json` ha `"type": "module"` ✅
- [ ] `start` script è `"node src/server.js"` ✅
- [ ] Tutti i file sono nel repository
- [ ] `.gitignore` non esclude file necessari
- [ ] Variabili d'ambiente configurate
- [ ] Root Directory è `server`

## 🔄 Deploy Pulito

Se nulla funziona, fai un deploy pulito:

1. **Elimina il servizio** su Railway
2. **Crea nuovo servizio** da zero
3. **Connetti GitHub** → Seleziona repository
4. **Configura:**
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
5. **Aggiungi variabili d'ambiente**
6. **Deploy**

## 📞 Supporto

Se il problema persiste:
1. Copia i log completi da Railway
2. Verifica che il server funzioni localmente
3. Controlla che tutti i file siano nel repository GitHub

## ✅ Verifica Funzionamento

Dopo il deploy, testa:
```bash
curl https://tuo-url-railway.com/health
```

Dovresti ricevere:
```json
{"status":"ok","timestamp":"..."}
```

Se ricevi questo, il server è online! ✅

