import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Replace with your actual backend URL
    const SOCKET_URL = 'http://localhost:3000';
    
    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token')
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return { socket: socketRef.current, isConnected };
};