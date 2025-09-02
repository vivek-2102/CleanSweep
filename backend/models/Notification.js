const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['cleaning_due', 'cleaning_requested', 'cleaning_completed', 'cleaning_approved', 'reminder'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed // For storing related request ID, etc.
  },
  read: {
    type: Boolean,
    default: false
  },
  deliveryMethod: {
    type: String,
    enum: ['push', 'email', 'sms'],
    default: 'push'
  },
  sent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);