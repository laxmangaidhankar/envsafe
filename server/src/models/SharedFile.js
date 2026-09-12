const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: 'text/plain'
    },
    size: {
      type: Number,
      default: 0
    },
    fileType: {
      type: String,
      enum: ['file', 'text', 'code'],
      default: 'file'
    },
    ciphertext: {
      type: String,
      required: true
    },
    iv: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
   
    }
  },
  {
    timestamps: true
  }
);

// TTL index on expiresAt
sharedFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SharedFile', sharedFileSchema);
