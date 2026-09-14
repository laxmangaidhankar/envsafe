const Room = require("../models/Room");
const SharedFile = require("../models/SharedFile");
const crypto = require("crypto");

const logger = require("../utils/logger");

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
      logger.error(
        {
          event: "room_id_generation_failed",
          attempts,
        },
        "Failed to generate unique room ID",
      );

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

    // Production-safe structured log
    logger.info(
      {
        event: "room_created",
        roomId: room.roomId,
        expiresAt: room.expiresAt.toISOString(),
        maxParticipants: room.maxParticipants,
        durationMinutes: validDuration,
      },
      "Room created",
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
    logger.error(
      {
        event: "room_creation_failed",
        err: error,
      },
      "Failed to create room",
    );

    return res.status(500).json({
      success: false,
      error: "Failed to create room.",
    });
  }
}

/**
 * GET /api/v1/rooms/:roomId
 * Get temporary room.
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
    logger.error(
      {
        event: "room_retrieval_failed",
        roomId: req.params.roomId,
        err: error,
      },
      "Failed to retrieve room status",
    );

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve room status.",
    });
  }
}
/**
 * DELETE /api/v1/rooms/:roomId
 * Delete a temporary room.
 */
async function destroyRoom(req, res) {
  try {
    const { room } = req;

    if (!room) {
      logger.warn(
        {
          event: "room_not_found",
          roomId: req.params.roomId,
        },
        "Room not found",
      );

      return res.status(404).json({
        success: false,
        error: "Room not found.",
      });
    }

    // Authorization should happen before destruction
    if (!req.roomAuthorized) {
      logger.warn(
        {
          event: "room_destroy_unauthorized",
          roomId: room.roomId,
        },
        "Unauthorized room destruction attempt",
      );

      return res.status(403).json({
        success: false,
        error: "You are not authorized to destroy this room.",
      });
    }

    // Mark room as destroyed
    room.status = "destroyed";
    await room.save();

    // Delete all shared files belonging to the room
    const deleteResult = await SharedFile.deleteMany({
      roomId: room.roomId,
    });

    // Notify connected clients
    const io = req.app.get("io");

    if (io) {
      io.to(room.roomId).emit("room:destroyed", {
        roomId: room.roomId,
        message: "The room has been destroyed.",
      });
    }

    // Production-safe structured log
    logger.info(
      {
        event: "room_destroyed",
        roomId: room.roomId,
        deletedFiles: deleteResult.deletedCount,
        socketNotificationSent: Boolean(io),
      },
      "Room destroyed",
    );

    return res.status(200).json({
      success: true,
      message: "Room destroyed successfully.",
    });
  } catch (error) {
    logger.error(
      {
        event: "room_destruction_failed",
        roomId: req.params.roomId,
        err: error,
      },
      "Failed to destroy room",
    );

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
