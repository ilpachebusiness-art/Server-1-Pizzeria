# Architettura PizzaFlow

## Struttura del Progetto

```
magicpath-project/
├── server/                 # Backend API Server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Data models e stores
│   │   ├── middleware/    # Auth, CORS, etc.
│   │   └── server.js      # Entry point
│   └── package.json
│
├── apps/                   # Applicazioni frontend separate
│   ├── customer/          # App Cliente
│   │   ├── main.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   ├── admin/             # Pannello Admin
│   │   ├── main.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── rider/             # App Fattorino
│       ├── main.tsx
│       ├── index.html
│       └── vite.config.ts
│
├── shared/                # Codice condiviso
│   └── api/              # API client
│
└── src/                   # Codice sorgente condiviso
    └── components/
        └── generated/    # Componenti React
```

## Comunicazione tra Applicazioni

Tutte le applicazioni comunicano attraverso il **server backend** tramite API REST:

```
┌─────────────┐
│   Customer  │──┐
│   App       │  │
└─────────────┘  │
                 │
┌─────────────┐  │      ┌──────────────┐      ┌─────────────┐
│    Admin    │──┼─────▶│   Server    │◀─────│  Database   │
│   Panel     │  │      │   (API)     │      │  (Future)   │
└─────────────┘  │      └──────────────┘      └─────────────┘
                 │
┌─────────────┐  │
│    Rider    │──┘
│   App       │
└─────────────┘
```

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/register` - Registrazione cliente
- `GET /api/auth/verify` - Verifica token

### Ordini
- `GET /api/orders` - Lista ordini (Admin)
- `GET /api/orders/:id` - Dettaglio ordine
- `POST /api/orders` - Crea ordine (Customer)
- `PATCH /api/orders/:id/status` - Aggiorna stato
- `PATCH /api/orders/:id/assign` - Assegna a fattorino (Admin)

### Menu
- `GET /api/menu/items` - Lista prodotti
- `GET /api/menu/categories` - Categorie
- `POST /api/menu/items` - Crea prodotto (Admin)

### Fattorini
- `GET /api/riders` - Lista fattorini (Admin)
- `GET /api/riders/available` - Fattorini disponibili
- `PATCH /api/riders/:id/status` - Aggiorna stato

### Batch
- `GET /api/batches` - Lista batch (Admin)
- `POST /api/batches` - Crea batch (Admin)

## Ruoli e Permessi

### Customer (Cliente)
- Visualizza menu
- Crea ordini
- Visualizza propri ordini
- Aggiorna profilo

### Rider (Fattorino)
- Visualizza ordini assegnati
- Aggiorna stato ordini
- Aggiorna proprio stato (disponibile/in consegna/offline)
- Visualizza batch assegnati

### Admin (Amministratore)
- Accesso completo a tutte le funzionalità
- Gestione ordini, menu, fattorini, batch
- Visualizzazione statistiche
- Gestione configurazioni

## Flusso di Comunicazione

### 1. Cliente crea ordine
```
Customer App → POST /api/orders → Server → Database
Server → Notifica Admin Panel (via WebSocket futuro)
```

### 2. Admin assegna ordine a fattorino
```
Admin Panel → PATCH /api/orders/:id/assign → Server → Database
Server → Notifica Rider App (via WebSocket futuro)
```

### 3. Fattorino aggiorna stato ordine
```
Rider App → PATCH /api/orders/:id/status → Server → Database
Server → Notifica Admin Panel e Customer App (via WebSocket futuro)
```

## Setup e Avvio

### 1. Avvia il Server
```bash
cd server
npm install
npm run dev
```
Server disponibile su: `http://localhost:3001`

### 2. Avvia le Applicazioni

**Customer App:**
```bash
cd apps/customer
npm install
npm run dev
```
Disponibile su: `http://localhost:5174`

**Admin Panel:**
```bash
cd apps/admin
npm install
npm run dev
```
Disponibile su: `http://localhost:5175`

**Rider App:**
```bash
cd apps/rider
npm install
npm run dev
```
Disponibile su: `http://localhost:5176`

## Variabili d'Ambiente

### Server (.env)
```
PORT=3001
NODE_ENV=development
JWT_SECRET=pizzaflow-secret-key-change-in-production
```

### Frontend Apps (.env)
```
VITE_API_URL=http://localhost:3001/api
```

## Prossimi Passi

1. ✅ Server backend con API REST
2. ✅ Separazione applicazioni
3. ✅ Sistema di autenticazione
4. ⏳ Integrazione WebSocket per notifiche real-time
5. ⏳ Database persistente (PostgreSQL/MongoDB)
6. ⏳ Sistema di cache (Redis)
7. ⏳ Test automatizzati
8. ⏳ CI/CD pipeline



