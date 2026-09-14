import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    // In development with Vite proxy, use window.location.origin or explicit port 3000
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : window.location.origin;

    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }
  return socket;
};

export const connectRoomSocket = (roomId, callbacks = {}) => {
  const socketInstance = getSocket();

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  socketInstance.emit('join-room', { roomId });

  if (callbacks.onRoomJoined) {
    socketInstance.off('room:joined').on('room:joined', callbacks.onRoomJoined);
  }

  if (callbacks.onFileAdded) {
    socketInstance.off('file:added').on('file:added', callbacks.onFileAdded);
  }

  if (callbacks.onFileDeleted) {
    socketInstance.off('file:deleted').on('file:deleted', callbacks.onFileDeleted);
  }

  if (callbacks.onRoomExpired) {
    socketInstance.off('room:expired').on('room:expired', callbacks.onRoomExpired);
  }

  if (callbacks.onRoomDestroyed) {
    socketInstance.off('room:destroyed').on('room:destroyed', callbacks.onRoomDestroyed);
  }

  if (callbacks.onParticipantLeft) {
    socketInstance.off('participant:left').on('participant:left', callbacks.onParticipantLeft);
  }

  return () => {
    socketInstance.emit('leave-room', { roomId });
    socketInstance.off('room:joined');
    socketInstance.off('file:added');
    socketInstance.off('file:deleted');
    socketInstance.off('room:expired');
    socketInstance.off('room:destroyed');
    socketInstance.off('participant:left');
  };
};
