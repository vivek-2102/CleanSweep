const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllPendingRooms,
  getAllUsers,
  getStats
} = require('../controllers/adminController');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(['admin']));

router.get('/pending-rooms', getAllPendingRooms);
router.get('/users', getAllUsers);
router.get('/stats', getStats);

module.exports = router;