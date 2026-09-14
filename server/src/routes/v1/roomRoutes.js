const express = require('express');
const roomRouter = express.Router();
const { createRoom, getRoom, destroyRoom } = require('../../controllers/roomController');
const { verifyRoomActive } = require('../../middleware/roomAccess');
const { authorizeRoomDestroy } = require('../../middleware/authorizeRoomDestroy');
const { roomCreateLimiter, roomJoinLimiter } = require('../../middleware/rateLimiter');

// POST /api/rooms - Create a new room
roomRouter.post('/', roomCreateLimiter, createRoom);

// GET /api/rooms/:roomId - Check room status
roomRouter.get('/:roomId', roomJoinLimiter, verifyRoomActive, getRoom);

// DELETE /api/rooms/:roomId - Manually destroy room
roomRouter.delete('/:roomId',verifyRoomActive,  authorizeRoomDestroy, destroyRoom);

module.exports = roomRouter;
