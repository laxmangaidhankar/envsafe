const Room = require("../models/Room");
const SharedFile = require("../models/SharedFile");
const crypto = require("crypto");

// Generate random uppercase alphanumeric room ID (e.g., X7K29P)
const generateRoomId = (length = 6) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
};

const generateDestroyToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashDestroyToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * POST /api/v1/rooms
 * Create a new temporary room.
 */
async function createRoom(req, res) {
  try {
    const { durationMinutes = 10, maxParticipants = 2 } = req.body;

    // Validate duration
    const parsedDuration = Number(durationMinutes);
    const validDurations = [5, 10, 30, 60];

    const validDuration = validDurations.includes(parsedDuration)
      ? parsedDuration
      : 10;

    // Validate participant limit
    const parsedMaxParticipants = Number(maxParticipants);

    const validMaxParticipants = Number.isInteger(parsedMaxParticipants)
      ? Math.min(Math.max(parsedMaxParticipants, 2), 10)
      : 2;

    // Generate unique room ID
    let roomId;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      roomId = generateRoomId(6);

      const existingRoom = await Room.exists({ roomId });

      if (!existingRoom) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate unique room ID. Please try again.",
      });
    }

    // Generate creator's secret token
    const destroyToken = generateDestroyToken();

    // Store only the hash
    const destroyTokenHash = hashDestroyToken(destroyToken);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + validDuration * 60 * 1000);

    // Create room
    const room = await Room.create({
      roomId,
      destroyTokenHash,
      expiresAt,
      maxParticipants: validMaxParticipants,
      status: "active",
    });

    console.log(
      `[Room Created] ID: ${roomId} | Expires: ${expiresAt.toISOString()}`,
    );

    return res.status(201).json({
      success: true,
      room: {
        roomId: room.roomId,
        destroyToken,
        expiresAt: room.expiresAt,
        maxParticipants: room.maxParticipants,
        status: room.status,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error(`[createRoom Error]: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: "Failed to create room.",
    });
  }
}

/**
 * GET /api/v1/rooms/:roomId
 * get temporary room.
 */
async function getRoom(req, res) {
  try {
    const { room } = req;

    return res.status(200).json({
      success: true,
      room: {
        roomId: room.roomId,
        expiresAt: room.expiresAt,
        maxParticipants: room.maxParticipants,
        status: room.status,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error(`[getRoom Error]: ${error.message}`);
    return res.status(500).json({ error: "Failed to retrieve room status." });
  }
}

/**
 * DELETE /api/v1/rooms/:roomId
 * delete a temporary room.
 */
async function destroyRoom(req, res) {
  try {
    const { room } = req;
    console.log(room);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found.",
      });
    }
    console.log(req.roomAuthorized);

    // Authorization should happen before destruction
    if (!req.roomAuthorized) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to destroy this room.",
      });
    }

    room.status = "destroyed";
    await room.save();

    const deleteResult = await SharedFile.deleteMany({
      roomId: room.roomId,
    });

    const io = req.app.get("io");

    if (io) {
      io.to(room.roomId).emit("room:destroyed", {
        roomId: room.roomId,
        message: "The room has been destroyed.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Room destroyed successfully.",
    });
  } catch (error) {
    console.error(`[destroyRoom Error]: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: "Failed to destroy room.",
    });
  }
}

module.exports = {
  createRoom,
  getRoom,
  destroyRoom,
};
