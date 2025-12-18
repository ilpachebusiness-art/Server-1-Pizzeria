# 🔧 Risoluzione: "No repositories found" su Railway

## Problema
Railway non trova il repository GitHub quando provi a deployare.

## Cause Possibili

1. **Repository privato** - Railway potrebbe non vedere repository privati se non autorizzato
2. **Autorizzazione GitHub** - Railway non ha accesso al repository
3. **Nome repository errato** - Il nome potrebbe non corrispondere

## ✅ Soluzioni

### Soluzione 1: Rendi il Repository Pubblico (Più Semplice)

1. Vai su: https://github.com/ilpachebusiness-art/Server-1-Pizzeria/settings
2. Scorri fino alla sezione **"Danger Zone"**
3. Clicca su **"Change visibility"**
4. Seleziona **"Make public"**
5. Conferma l'operazione
6. Torna su Railway e riprova a cercare il repository

### Soluzione 2: Autorizza Railway Correttamente

1. In Railway, quando autorizzi GitHub:
   - Assicurati di selezionare **"All repositories"** oppure
   - Seleziona specificamente il repository `Server-1-Pizzeria`
2. Autorizza l'accesso completo
3. Riprova a cercare il repository

### Soluzione 3: Deploy Manuale con Railway CLI

Se le soluzioni sopra non funzionano, puoi deployare manualmente:

#### Installa Railway CLI

**Windows (PowerShell):**
```powershell
iwr https://railway.app/install.ps1 | iex
```

**Oppure con npm:**
```powershell
npm i -g @railway/cli
```

#### Deploy

```powershell
cd server
railway login
railway init
railway up
```

Railway creerà automaticamente un progetto e deployerà il codice.

### Soluzione 4: Usa Render (Alternativa)

Se Railway continua a dare problemi, puoi usare Render:

1. Vai su: https://render.com
2. Clicca "New" → "Web Service"
3. Connetti GitHub
4. Seleziona il repository
5. Configura:
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
6. Aggiungi variabili d'ambiente
7. Deploy!

## 🎯 Soluzione Consigliata

**Rendi il repository pubblico** (Soluzione 1) è la più semplice e veloce. Una volta pubblico, Railway lo troverà immediatamente.

## 📝 Dopo aver risolto

Una volta che Railway trova il repository:

1. Seleziona il repository
2. Configura Root Directory: `server`
3. Aggiungi variabili d'ambiente:
   ```
   NODE_ENV=production
   JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
   ALLOWED_ORIGINS=*
   ```
4. Deploy!

