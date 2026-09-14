const Room = require('../models/Room');
const SharedFile = require('../models/SharedFile');

let cleanupInterval = null;

const startCleanupService = (io, intervalMs = 30000) => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  console.log(`[Cleanup Service] Started (checking every ${intervalMs / 1000}s)`);

  cleanupInterval = setInterval(async () => {
    try {
      const now = new Date();

      // Find active rooms that have expired
      const expiredRooms = await Room.find({
        status: 'active',
        expiresAt: { $lte: now }
      });

      if (expiredRooms.length > 0) {
        console.log(`[Cleanup Service] Found ${expiredRooms.length} expired room(s). Purging encrypted files...`);

        for (const room of expiredRooms) {
          // Mark room status as expired
          room.status = 'expired';
          await room.save();

          // Delete all encrypted file records for this room
          const deletedFiles = await SharedFile.deleteMany({ roomId: room.roomId });

          console.log(`[Room Purged] Room: ${room.roomId} | Files Deleted: ${deletedFiles.deletedCount}`);

          // Emit live socket event to notify connected clients
          if (io) {
            io.to(room.roomId).emit('room:expired', {
              roomId: room.roomId,
              message: 'This room has reached its expiration time. All encrypted data has been permanently erased.'
            });
          }
        }
      }
    } catch (error) {
      console.error(`[Cleanup Service Error]: ${error.message}`);
    }
  }, intervalMs);
};

const stopCleanupService = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[Cleanup Service] Stopped');
  }
};

module.exports = {
  startCleanupService,
  stopCleanupService
};
