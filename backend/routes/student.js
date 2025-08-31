const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  requestCleaning,
  getCleaningHistory,
  approveCleaningCompletion
} = require('../controllers/studentController');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(['student']));

router.post('/request-cleaning', requestCleaning);
router.get('/cleaning-history', getCleaningHistory);
router.put('/approve-cleaning/:requestId', approveCleaningCompletion);

module.exports = router;