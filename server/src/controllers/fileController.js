const SharedFile = require('../models/SharedFile');

// Upload encrypted file / secret snippet
async function uploadFile(req, res){
  try {
    const { room } = req;
    const { fileName, mimeType, size, fileType, ciphertext, iv } = req.body;

    if (!fileName || !ciphertext || !iv) {
      return res.status(400).json({ error: 'Missing required file payload fields (fileName, ciphertext, iv).' });
    }

    // Limit ciphertext payload size (max 10MB string ~ 14MB base64)
    if (ciphertext.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'File payload exceeds maximum limit of 10MB.' });
    }

    const sharedFile = new SharedFile({
      roomId: room.roomId,
      fileName,
      mimeType: mimeType || 'text/plain',
      size: size || 0,
      fileType: fileType || 'file',
      ciphertext,
      iv,
      expiresAt: room.expiresAt
    });

    await sharedFile.save();

    console.log(`[File Uploaded] Room: ${room.roomId} | File: ${fileName} (${size} bytes, type: ${fileType})`);

    // Emit live socket event to room participants
    const io = req.app.get('io');
    if (io) {
      io.to(room.roomId).emit('file:added', {
        file: {
          _id: sharedFile._id,
          roomId: sharedFile.roomId,
          fileName: sharedFile.fileName,
          mimeType: sharedFile.mimeType,
          size: sharedFile.size,
          fileType: sharedFile.fileType,
          ciphertext: sharedFile.ciphertext,
          iv: sharedFile.iv,
          createdAt: sharedFile.createdAt
        }
      });
    }

    return res.status(201).json({
      success: true,
      file: {
        _id: sharedFile._id,
        roomId: sharedFile.roomId,
        fileName: sharedFile.fileName,
        mimeType: sharedFile.mimeType,
        size: sharedFile.size,
        fileType: sharedFile.fileType,
        ciphertext: sharedFile.ciphertext,
        iv: sharedFile.iv,
        createdAt: sharedFile.createdAt
      }
    });
  } catch (error) {
    console.error(`[uploadFile Error]: ${error.message}`);
    return res.status(500).json({ error: 'Failed to upload encrypted file.' });
  }
};

// Get all encrypted files for a room
async function getFiles(req, res) {
  try {
    const { room } = req;

    const files = await SharedFile.find({ roomId: room.roomId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: files.length,
      files: files.map((file) => ({
        _id: file._id,
        roomId: file.roomId,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
        fileType: file.fileType,
        ciphertext: file.ciphertext,
        iv: file.iv,
        createdAt: file.createdAt
      }))
    });
  } catch (error) {
    console.error(`[getFiles Error]: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve files.' });
  }
};

// Delete a single file
async function deleteFile(req, res) {
  try {
    const { room } = req;
    const { fileId } = req.params;

    const file = await SharedFile.findOneAndDelete({ _id: fileId, roomId: room.roomId });

    if (!file) {
      return res.status(404).json({ error: 'File not found or already deleted.' });
    }

    console.log(`[File Deleted] Room: ${room.roomId} | File ID: ${fileId}`);

    // Emit live socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(room.roomId).emit('file:deleted', {
        fileId,
        fileName: file.fileName
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully.',
      fileId
    });
  } catch (error) {
    console.error(`[deleteFile Error]: ${error.message}`);
    return res.status(500).json({ error: 'Failed to delete file.' });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  deleteFile
};
