const mongoose = require('mongoose');

const cleaningRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sweeper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  hostelNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'approved'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  approvedDate: {
    type: Date
  },
  lastCleaningDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CleaningRequest', cleaningRequestSchema);