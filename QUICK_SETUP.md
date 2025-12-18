# ⚡ Quick Setup - Deploy PizzaFlow Server

## Repository GitHub
https://github.com/ilpachebusiness-art/Server-1-Pizzeria.git

---

## 🚀 Opzione 1: Railway (Consigliato - 2 minuti)

### Step 1: Crea Progetto
1. Vai su: **https://railway.app/new**
2. Clicca **"Deploy from GitHub repo"**
3. Autorizza GitHub se richiesto
4. Seleziona: **ilpachebusiness-art/Server-1-Pizzeria**

### Step 2: Configura
Railway dovrebbe rilevare automaticamente. Se non lo fa:
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Variabili d'Ambiente
Vai su **Settings** → **Variables**, aggiungi:

```
NODE_ENV=production
JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
ALLOWED_ORIGINS=*
```

### Step 4: Deploy
- Railway deployerà automaticamente
- Attendi 2-3 minuti
- Copia l'URL dal tab **Settings** → **Domains**

### Step 5: Configura Frontend
Crea file `.env` nella root del progetto:
```env
VITE_API_URL=https://tuo-url-railway.com/api
```

---

## 🌐 Opzione 2: Render (Alternativa - 3 minuti)

### Step 1: Crea Web Service
1. Vai su: **https://render.com**
2. Clicca **"New"** → **"Web Service"**
3. Connetti GitHub
4. Seleziona: **ilpachebusiness-art/Server-1-Pizzeria**

### Step 2: Configura
- **Name**: `pizzaflow-server`
- **Environment**: `Node`
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Variabili d'Ambiente
Nella sezione **Environment Variables**:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
ALLOWED_ORIGINS=*
```

### Step 4: Deploy
- Clicca **"Create Web Service"**
- Attendi il deploy
- L'URL sarà: `https://pizzaflow-server.onrender.com`

### Step 5: Configura Frontend
Crea file `.env` nella root:
```env
VITE_API_URL=https://pizzaflow-server.onrender.com/api
```

---

## ✅ Verifica Deploy

Testa l'endpoint:
```bash
curl https://tuo-url.com/health
```

Dovresti ricevere:
```json
{"status":"ok","timestamp":"..."}
```

---

## 🎯 Variabili d'Ambiente

**JWT_SECRET** (già generato):
```
SYxVe6wkZDKy5MuNDg0U4jyfa2pJm9yPeafdUlGQU/M=
```

**ALLOWED_ORIGINS**:
- `*` = Permette tutte le origini (per sviluppo)
- Per produzione: `https://tuo-frontend.com,https://www.tuo-frontend.com`

---

## 📱 Dopo il Deploy

1. **Copia l'URL del server** (es: `https://pizzaflow-server-production.up.railway.app`)
2. **Crea `.env` nella root del progetto**:
   ```env
   VITE_API_URL=https://tuo-url-server.com/api
   ```
3. **Riavvia le app frontend** per caricare la nuova configurazione
4. **Testa**: Apri l'app e verifica che si connetta al server cloud

---

## 🆘 Troubleshooting

### Server non si avvia
- Controlla i log nella dashboard
- Verifica variabili d'ambiente
- Assicurati che `PORT` non sia necessario (Railway/Render lo imposta)

### CORS Errors
- Verifica `ALLOWED_ORIGINS=*`
- Controlla che il frontend usi l'URL corretto

### WebSocket non funziona
- Usa `wss://` (non `ws://`) per HTTPS
- Verifica che la piattaforma supporti WebSocket

---

## 🎉 Fatto!

Il server è ora:
- ✅ Sempre online
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Con WebSocket per aggiornamenti live
- ✅ Non richiede computer acceso

