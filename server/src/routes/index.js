const express = require('express');

const router = express.Router();

const fileRoutes = require('./v1/fileRoutes');
const roomRoutes = require('./v1/roomRoutes');

router.use('/rooms/files', fileRoutes);
router.use('/rooms', roomRoutes);


module.exports = router;