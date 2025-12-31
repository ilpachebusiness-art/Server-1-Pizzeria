import { WebSocketServer } from 'ws';

let wss = null;
const clients = {
  admin: new Set(),
  rider: new Set(),
  customer: new Set(),
};

// Traccia i rider connessi con le loro informazioni
const connectedRiders = new Map(); // deviceId -> { ws, riderName, riderId, connectedAt }

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          const { role, riderName, deviceId, riderId } = data;
          if (role && clients[role]) {
            clients[role].add(ws);
            console.log(`Client subscribed as ${role}`);
            
            // Se è un rider, traccia le informazioni
            if (role === 'rider' && deviceId) {
              connectedRiders.set(deviceId, {
                ws: ws,
                riderName: riderName || 'Fattorino',
                riderId: riderId || deviceId,
                deviceId: deviceId,
                connectedAt: new Date().toISOString()
              });
              
              console.log(`Rider connected: ${riderName} (${deviceId})`);
              
              // Notifica gli admin che un nuovo rider si è connesso
              broadcastToAdmins({
                type: 'rider_connected',
                rider: {
                  name: riderName,
                  deviceId: deviceId,
                  riderId: riderId || deviceId
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Rimuovi dai client sets
      Object.values(clients).forEach(clientSet => {
        clientSet.delete(ws);
      });
      
      // Rimuovi dai rider connessi se presente
      for (const [deviceId, riderInfo] of connectedRiders.entries()) {
        if (riderInfo.ws === ws) {
          connectedRiders.delete(deviceId);
          console.log(`Rider disconnected: ${riderInfo.riderName} (${deviceId})`);
          
          // Notifica gli admin che un rider si è disconnesso
          broadcastToAdmins({
            type: 'rider_disconnected',
            deviceId: deviceId,
            riderId: riderInfo.riderId
          });
          break;
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized');
}

// Ottieni lista rider connessi
export function getConnectedRiders() {
  return Array.from(connectedRiders.values()).map(rider => ({
    name: rider.riderName,
    deviceId: rider.deviceId,
    riderId: rider.riderId,
    connectedAt: rider.connectedAt
  }));
}

// Aggiorna nome di un rider connesso
export function updateRiderName(deviceId, newName) {
  const rider = connectedRiders.get(deviceId);
  if (rider) {
    rider.riderName = newName;
    
    // Notifica il rider del cambio nome
    if (rider.ws.readyState === 1) { // WebSocket.OPEN
      rider.ws.send(JSON.stringify({
        type: 'rider_name_updated',
        riderId: rider.riderId,
        newName: newName
      }));
    }
    
    // Notifica gli admin
    broadcastToAdmins({
      type: 'rider_name_updated',
      deviceId: deviceId,
      riderId: rider.riderId,
      newName: newName
    });
    
    return true;
  }
  return false;
}

export function broadcastToAdmins(data) {
  const message = JSON.stringify(data);
  clients.admin.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

export function broadcastToRiders(data) {
  const message = JSON.stringify(data);
  clients.rider.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

export function broadcastToCustomers(data) {
  const message = JSON.stringify(data);
  clients.customer.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

export function broadcastToAll(data) {
  const message = JSON.stringify(data);
  [...clients.admin, ...clients.rider, ...clients.customer].forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}


