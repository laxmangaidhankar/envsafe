const crypto = require("crypto");

async function authorizeRoomDestroy (req, res, next){
  try {
    const token = req.get("X-Room-Token");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Room destruction token is required.",
      });
    }

    const { room } = req;

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    if (tokenHash !== room.destroyTokenHash) {
      return res.status(403).json({
        success: false,
        error: "Invalid room destruction token.",
      });
    }

    req.roomAuthorized = true;

    next();
  } catch (error) {
    console.error(`[authorizeRoomDestroy Error]: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: "Authorization failed.",
    });
  }
};

module.exports = {authorizeRoomDestroy};