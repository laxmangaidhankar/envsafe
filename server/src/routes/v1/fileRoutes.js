const express = require('express');
const fileRouter = express.Router({ mergeParams: true });
const { uploadFile, getFiles, deleteFile } = require('../../controllers/fileController');
const { verifyRoomActive } = require('../../middleware/roomAccess');
const { fileUploadLimiter } = require('../../middleware/rateLimiter');

// POST /api/rooms/:roomId/files - Upload encrypted file
fileRouter.post('/:roomId', fileUploadLimiter, verifyRoomActive, uploadFile);

// GET /api/rooms/:roomId/files - List all ciphertext files
fileRouter.get('/:roomId', verifyRoomActive, getFiles);

// DELETE /api/rooms/:roomId/files/:fileId - Delete an encrypted file
fileRouter.delete('/:roomId/:fileId', verifyRoomActive, deleteFile);

module.exports = fileRouter;
