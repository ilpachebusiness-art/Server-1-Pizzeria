import { useEffect, useRef, useState } from 'react';
import { getWsUrl } from '../config/api';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(role: 'admin' | 'rider' | 'customer', onMessage?: (data: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      try {
        const wsUrl = getWsUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log(`WebSocket connected (${role})`);
          setIsConnected(true);
          // Subscribe with role
          ws.send(JSON.stringify({ type: 'subscribe', role }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (onMessage) {
              onMessage(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log(`WebSocket disconnected (${role})`);
          setIsConnected(false);
          // Try to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, 3000);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [role, onMessage]);

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { isConnected, send };
}


