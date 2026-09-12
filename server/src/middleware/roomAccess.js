const Room = require('../models/Room');

const verifyRoomActive = async (req, res, next) => {
  try {
    const roomId = req.params.roomId || req.body.roomId;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required.' });
    }

    const room = await Room.findOne({ roomId: roomId.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or has been deleted.' });
    }

    if (room.status !== 'active') {
      return res.status(410).json({ error: `Room is no longer active (Status: ${room.status}).` });
    }

    // Check if room has expired
    if (new Date() > new Date(room.expiresAt)) {
      room.status = 'expired';
      await room.save();
      return res.status(410).json({ error: 'Room has expired and files have been scheduled for deletion.' });
    }

    req.room = room;
    next();
  } catch (error) {
    console.error(`[Room Access Middleware Error]: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error while verifying room status.' });
  }
};

module.exports = {
  verifyRoomActive
};
