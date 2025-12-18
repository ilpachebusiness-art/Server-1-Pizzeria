import { WebSocketServer } from 'ws';

let wss = null;
const clients = {
  admin: new Set(),
  rider: new Set(),
  customer: new Set(),
};

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          const { role } = data;
          if (role && clients[role]) {
            clients[role].add(ws);
            console.log(`Client subscribed as ${role}`);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Remove from all client sets
      Object.values(clients).forEach(clientSet => {
        clientSet.delete(ws);
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized');
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


