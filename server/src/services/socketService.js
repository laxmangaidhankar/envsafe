const initSocketService = (io) => {
  // Store participant socket maps per room
  const roomParticipants = new Map(); // roomId => Set of socket.id

  io.on('connection', (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // Join a room
    socket.on('join-room', ({ roomId }) => {
      if (!roomId) return;
      const cleanRoomId = roomId.toUpperCase();

      socket.join(cleanRoomId);
      socket.currentRoomId = cleanRoomId;

      if (!roomParticipants.has(cleanRoomId)) {
        roomParticipants.set(cleanRoomId, new Set());
      }
      roomParticipants.get(cleanRoomId).add(socket.id);

      const count = roomParticipants.get(cleanRoomId).size;

      console.log(`[Socket Join] Socket ${socket.id} joined room ${cleanRoomId}. Total: ${count}`);

      // Notify others in room
      io.to(cleanRoomId).emit('room:joined', {
        socketId: socket.id,
        participantCount: count
      });
    });

    // Leave a room
    socket.on('leave-room', ({ roomId }) => {
      if (!roomId) return;
      const cleanRoomId = roomId.toUpperCase();

      socket.leave(cleanRoomId);

      if (roomParticipants.has(cleanRoomId)) {
        roomParticipants.get(cleanRoomId).delete(socket.id);
        const count = roomParticipants.get(cleanRoomId).size;

        if (count === 0) {
          roomParticipants.delete(cleanRoomId);
        } else {
          io.to(cleanRoomId).emit('participant:left', {
            socketId: socket.id,
            participantCount: count
          });
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] ID: ${socket.id}`);
      if (socket.currentRoomId) {
        const cleanRoomId = socket.currentRoomId;
        if (roomParticipants.has(cleanRoomId)) {
          roomParticipants.get(cleanRoomId).delete(socket.id);
          const count = roomParticipants.get(cleanRoomId).size;

          if (count === 0) {
            roomParticipants.delete(cleanRoomId);
          } else {
            io.to(cleanRoomId).emit('participant:left', {
              socketId: socket.id,
              participantCount: count
            });
          }
        }
      }
    });
  });
};

module.exports = {
  initSocketService
};
