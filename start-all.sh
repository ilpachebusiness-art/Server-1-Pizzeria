#!/bin/bash

# Script Bash per avviare tutte le applicazioni

echo "========================================"
echo "  PizzaFlow - Avvio Applicazioni"
echo "========================================"
echo ""

# Verifica che Node.js sia installato
if ! command -v node &> /dev/null; then
    echo "ERRORE: Node.js non trovato!"
    echo "Installa Node.js da https://nodejs.org/"
    exit 1
fi

echo "[1/4] Installazione dipendenze server..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "  Dipendenze già installate"
fi
cd ..

echo ""
echo "[2/4] Installazione dipendenze app Customer..."
cd apps/customer
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "  Dipendenze già installate"
fi
cd ../..

echo ""
echo "[3/4] Installazione dipendenze app Admin..."
cd apps/admin
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "  Dipendenze già installate"
fi
cd ../..

echo ""
echo "[4/4] Installazione dipendenze app Rider..."
cd apps/rider
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "  Dipendenze già installate"
fi
cd ../..

echo ""
echo "========================================"
echo "  Avvio Server e Applicazioni..."
echo "========================================"
echo ""
echo "Server: http://localhost:3001"
echo "Customer App: http://localhost:5174"
echo "Admin Panel: http://localhost:5175"
echo "Rider App: http://localhost:5176"
echo ""
echo "Premi CTRL+C per fermare tutti i servizi"
echo ""

# Avvia tutti i servizi in background
cd server && npm run dev &
SERVER_PID=$!
sleep 3

cd ../apps/customer && npm run dev &
CUSTOMER_PID=$!
sleep 2

cd ../admin && npm run dev &
ADMIN_PID=$!
sleep 2

cd ../rider && npm run dev &
RIDER_PID=$!

cd ../../..

echo ""
echo "Tutte le applicazioni sono state avviate!"
echo "Apri i browser per accedere alle applicazioni."
echo ""
echo "PIDs: Server=$SERVER_PID, Customer=$CUSTOMER_PID, Admin=$ADMIN_PID, Rider=$RIDER_PID"
echo "Per fermare: kill $SERVER_PID $CUSTOMER_PID $ADMIN_PID $RIDER_PID"

# Attendi che l'utente prema CTRL+C
trap "kill $SERVER_PID $CUSTOMER_PID $ADMIN_PID $RIDER_PID; exit" INT TERM
wait



