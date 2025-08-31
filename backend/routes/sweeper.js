const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getPendingRooms,
  markRoomCleaned,
  getCleaningHistory
} = require('../controllers/sweeperController');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(['sweeper']));

router.get('/pending-rooms', getPendingRooms);
router.put('/mark-cleaned/:requestId', markRoomCleaned);
router.get('/cleaning-history', getCleaningHistory);

module.exports = router;