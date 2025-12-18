# 🚀 Guida al Deploy di PizzaFlow Server

Questa guida ti aiuterà a deployare il server PizzaFlow su una piattaforma cloud in modo che sia sempre online e accessibile da qualsiasi dispositivo.

## 📋 Opzioni di Deploy

### 1. Railway (Consigliato - Facile e Gratuito)

Railway è la soluzione più semplice e offre un piano gratuito generoso.

#### Passi per il Deploy su Railway:

1. **Crea un account su Railway**
   - Vai su https://railway.app
   - Clicca su "Sign Up" e registrati con GitHub

2. **Crea un nuovo progetto**
   - Clicca su "New Project"
   - Seleziona "Deploy from GitHub repo"
   - Autorizza Railway ad accedere al tuo repository GitHub
   - Seleziona il repository `magicpath-project`

3. **Configura il servizio**
   - Railway rileverà automaticamente la cartella `server`
   - Se non lo fa, imposta:
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

4. **Configura le variabili d'ambiente**
   - Vai su "Variables" nel tuo progetto Railway
   - Aggiungi:
     ```
     NODE_ENV=production
     PORT=3001
     JWT_SECRET=il-tuo-secret-key-super-sicuro-cambia-questo
     ALLOWED_ORIGINS=*
     ```
   - **IMPORTANTE**: Genera un JWT_SECRET sicuro (puoi usare: `openssl rand -base64 32`)

5. **Deploy**
   - Railway deployerà automaticamente
   - Una volta completato, otterrai un URL tipo: `https://pizzaflow-server-production.up.railway.app`

6. **Ottieni l'URL del server**
   - Vai su "Settings" → "Domains"
   - Railway fornisce automaticamente un dominio HTTPS
   - Copia l'URL (es: `https://pizzaflow-server-production.up.railway.app`)

---

### 2. Render (Alternativa Gratuita)

Render offre anche un piano gratuito con supporto WebSocket.

#### Passi per il Deploy su Render:

1. **Crea un account su Render**
   - Vai su https://render.com
   - Registrati con GitHub

2. **Crea un nuovo Web Service**
   - Clicca su "New" → "Web Service"
   - Connetti il tuo repository GitHub
   - Seleziona il repository

3. **Configura il servizio**
   - **Name**: `pizzaflow-server`
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Configura le variabili d'ambiente**
   - Nella sezione "Environment Variables":
     ```
     NODE_ENV=production
     PORT=10000
     JWT_SECRET=il-tuo-secret-key-super-sicuro
     ALLOWED_ORIGINS=*
     ```

5. **Deploy**
   - Clicca su "Create Web Service"
   - Render deployerà automaticamente
   - L'URL sarà tipo: `https://pizzaflow-server.onrender.com`

---

### 3. Fly.io (Ottimo per WebSocket)

Fly.io è ottimo per applicazioni con WebSocket e offre un piano gratuito.

#### Passi per il Deploy su Fly.io:

1. **Installa Fly CLI**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Nel progetto, nella cartella server**
   ```bash
   cd server
   fly launch
   ```
   - Segui le istruzioni interattive
   - Quando chiede di deployare, rispondi "no" per ora

4. **Configura le variabili d'ambiente**
   ```bash
   fly secrets set JWT_SECRET="il-tuo-secret-key-super-sicuro"
   fly secrets set NODE_ENV="production"
   fly secrets set ALLOWED_ORIGINS="*"
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Ottieni l'URL**
   ```bash
   fly info
   ```

---

## 🔧 Configurazione Frontend

Dopo aver deployato il server, devi configurare le app frontend per usare l'URL del server cloud invece di localhost.

### Opzione 1: Variabile d'Ambiente (Consigliato)

Crea un file `.env` nella root del progetto o in ogni app:

```env
VITE_API_URL=https://pizzaflow-server-production.up.railway.app/api
```

Oppure per Render:
```env
VITE_API_URL=https://pizzaflow-server.onrender.com/api
```

### Opzione 2: Modifica Manuale

Se non vuoi usare variabili d'ambiente, puoi modificare direttamente i file:
- `shared/config/api.ts` - Cambia l'URL di default
- Oppure modifica direttamente i componenti (non consigliato)

---

## ✅ Verifica del Deploy

1. **Testa l'endpoint di health check**
   ```bash
   curl https://tuo-server-url.com/health
   ```
   Dovresti ricevere: `{"status":"ok","timestamp":"..."}`

2. **Testa un endpoint API**
   ```bash
   curl https://tuo-server-url.com/api/menu/items
   ```

3. **Testa WebSocket**
   - Apri la console del browser
   - Esegui:
     ```javascript
     const ws = new WebSocket('wss://tuo-server-url.com/ws');
     ws.onopen = () => console.log('Connected!');
     ```

---

## 🔒 Sicurezza

### Variabili d'Ambiente Importanti:

- **JWT_SECRET**: Deve essere un valore casuale e sicuro. Genera con:
  ```bash
  openssl rand -base64 32
  ```

- **ALLOWED_ORIGINS**: 
  - `*` = Permette tutte le origini (per sviluppo/test)
  - Per produzione, specifica i domini esatti separati da virgola:
    ```
    ALLOWED_ORIGINS=https://tuo-frontend.com,https://www.tuo-frontend.com
    ```

---

## 📱 Accesso da Dispositivi Mobili

Una volta deployato, le app possono accedere al server da qualsiasi dispositivo:

1. **App Web**: Basta aprire l'URL del frontend deployato
2. **App Mobile**: Configura l'URL del server nelle variabili d'ambiente dell'app

---

## 🔄 Aggiornamenti Live

Il server supporta WebSocket per aggiornamenti in tempo reale. Assicurati che:

1. La piattaforma scelta supporti WebSocket (Railway, Render e Fly.io lo supportano)
2. L'URL WebSocket usi `wss://` (WebSocket Secure) per HTTPS

---

## 🆘 Troubleshooting

### Server non risponde
- Verifica che il server sia deployato correttamente
- Controlla i log nella dashboard della piattaforma
- Verifica che la porta sia configurata correttamente

### Errori CORS
- Verifica che `ALLOWED_ORIGINS` includa il dominio del frontend
- In sviluppo, puoi usare `*` per permettere tutte le origini

### WebSocket non funziona
- Verifica che la piattaforma supporti WebSocket
- Assicurati di usare `wss://` per connessioni HTTPS
- Controlla i log per errori di connessione

---

## 📞 Supporto

Per problemi o domande:
1. Controlla i log nella dashboard della piattaforma
2. Verifica la documentazione della piattaforma scelta
3. Controlla che tutte le variabili d'ambiente siano configurate correttamente

---

## 🎉 Fatto!

Una volta completato il deploy, il tuo server sarà:
- ✅ Sempre online
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Con supporto WebSocket per aggiornamenti live
- ✅ Non richiede che il tuo computer sia acceso

