# Separazione Applicazioni PizzaFlow

## ✅ Completato

Ho separato le tre applicazioni e creato un server backend per la comunicazione.

## Struttura Creata

### 1. Server Backend (`server/`)
- API REST completa con Express
- Autenticazione JWT
- Routes per Orders, Menu, Riders, Batches
- Middleware per autenticazione e autorizzazione
- Data stores in-memory (pronto per database)

### 2. Applicazioni Separate (`apps/`)
- **Customer App** (`apps/customer/`) - Porta 5174
- **Admin Panel** (`apps/admin/`) - Porta 5175  
- **Rider App** (`apps/rider/`) - Porta 5176

### 3. API Client Condiviso (`shared/api/`)
- Client API per comunicare con il server
- Gestione token e autenticazione
- Metodi per tutte le operazioni

## Come Avviare

### 1. Installa le dipendenze
```bash
npm run install:all
```

Oppure manualmente:
```bash
# Server
cd server && npm install && cd ..

# Apps
cd apps/customer && npm install && cd ../..
cd apps/admin && npm install && cd ../..
cd apps/rider && npm install && cd ../..
```

### 2. Avvia il Server
```bash
npm run server:dev
```
Server su: `http://localhost:3001`

### 3. Avvia le Applicazioni

In terminali separati:

**Customer:**
```bash
npm run customer:dev
# http://localhost:5174
```

**Admin:**
```bash
npm run admin:dev
# http://localhost:5175
```

**Rider:**
```bash
npm run rider:dev
# http://localhost:5176
```

## Prossimi Passi per Integrazione Completa

### 1. Aggiornare i Componenti per Usare l'API

I componenti attualmente usano dati mock. Devi aggiornarli per usare `apiClient`:

**Esempio per PizzaFlowCustomer:**
```typescript
import { apiClient } from '../../../shared/api/client';

// Invece di dati mock, usa:
const [menuItems, setMenuItems] = useState([]);

useEffect(() => {
  apiClient.getMenuItems().then(setMenuItems);
}, []);
```

### 2. Aggiungere Autenticazione

Ogni app deve gestire il login:

```typescript
import { apiClient } from '../../../shared/api/client';

const handleLogin = async (email: string, password: string) => {
  const { token, user } = await apiClient.login(email, password);
  // Salva token e reindirizza
};
```

### 3. Configurare Variabili Ambiente

Crea file `.env` in ogni app:
```
VITE_API_URL=http://localhost:3001/api
```

## Documentazione

- `ARCHITETTURA.md` - Architettura completa del sistema
- `server/README.md` - Documentazione API server

## Note

- Il server usa data stores in-memory per ora (dati si perdono al riavvio)
- Per produzione, sostituisci con database (PostgreSQL/MongoDB)
- WebSocket può essere aggiunto per notifiche real-time
- Le app sono configurate con proxy Vite per evitare problemi CORS in sviluppo



