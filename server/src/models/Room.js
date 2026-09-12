const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    destroyTokenHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
    maxParticipants: {
      type: Number,
      default: 2,
      min: 2,
      max: 10,
    },
    status: {
      type: String,
      enum: ["active", "expired", "destroyed"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: String,
      default: "anonymous",
    },
  },
  {
    timestamps: true,
  },
);

// TTL index on expiresAt - documents auto-remove from Mongo shortly after expiry
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Room", roomSchema);
