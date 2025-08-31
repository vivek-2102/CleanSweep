// Backend: controllers/notificationController.js
const User = require('../models/User');
const CleaningRequest = require('../models/CleaningRequest');
const Notification = require('../models/Notification'); // We'll create this model

// Create Notification Model first
// models/Notification.js
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

// Notification Controller
const createNotification = async (recipientId, type, title, message, data = {}, deliveryMethod = 'push') => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      data,
      deliveryMethod
    });
    
    await notification.save();
    
    // Send push notification immediately
    if (deliveryMethod === 'push') {
      await sendPushNotification(notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const sendPushNotification = async (notification) => {
  try {
    // In a real app, you'd use a service like Firebase Cloud Messaging
    // For now, we'll just mark it as sent
    notification.sent = true;
    await notification.save();
    
    // Emit real-time notification via Socket.IO (if implemented)
    // io.to(notification.recipient.toString()).emit('notification', notification);
    
    console.log(`Push notification sent to user ${notification.recipient}: ${notification.title}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

const sendEmailNotification = async (notification) => {
  try {
    // Implement email sending logic here using services like:
    // - Nodemailer with Gmail/SMTP
    // - SendGrid
    // - AWS SES
    
    // For demonstration, we'll just log it
    console.log(`Email notification would be sent to user ${notification.recipient}: ${notification.title}`);
    
    notification.sent = true;
    await notification.save();
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

const sendSMSNotification = async (notification) => {
  try {
    // Implement SMS sending logic here using services like:
    // - Twilio
    // - AWS SNS
    // - Other SMS providers
    
    console.log(`SMS notification would be sent to user ${notification.recipient}: ${notification.title}`);
    
    notification.sent = true;
    await notification.save();
  } catch (error) {
    console.error('Error sending SMS notification:', error);
  }
};

// Notification triggers for different events
const notifyCleaningRequested = async (requestId) => {
  try {
    const request = await CleaningRequest.findById(requestId)
      .populate('student sweeper');
    
    if (!request) return;
    
    // Notify sweeper
    await createNotification(
      request.sweeper._id,
      'cleaning_requested',
      'New Cleaning Request',
      `New cleaning request from ${request.student.name} for room ${request.roomNumber}`,
      { requestId: request._id },
      'push'
    );
    
    // Notify student (confirmation)
    await createNotification(
      request.student._id,
      'cleaning_requested',
      'Cleaning Request Submitted',
      `Your cleaning request for room ${request.roomNumber} has been submitted to ${request.sweeper.name}`,
      { requestId: request._id },
      'push'
    );
  } catch (error) {
    console.error('Error sending cleaning requested notifications:', error);
  }
};

const notifyCleaningCompleted = async (requestId) => {
  try {
    const request = await CleaningRequest.findById(requestId)
      .populate('student sweeper');
    
    if (!request) return;
    
    // Notify student for approval
    await createNotification(
      request.student._id,
      'cleaning_completed',
      'Cleaning Completed - Approval Required',
      `${request.sweeper.name} has completed cleaning your room ${request.roomNumber}. Please approve if satisfied.`,
      { requestId: request._id },
      'push'
    );
  } catch (error) {
    console.error('Error sending cleaning completed notifications:', error);
  }
};

const notifyCleaningApproved = async (requestId) => {
  try {
    const request = await CleaningRequest.findById(requestId)
      .populate('student sweeper');
    
    if (!request) return;
    
    // Notify sweeper
    await createNotification(
      request.sweeper._id,
      'cleaning_approved',
      'Cleaning Approved',
      `${request.student.name} has approved your cleaning work for room ${request.roomNumber}. Great job!`,
      { requestId: request._id },
      'push'
    );
  } catch (error) {
    console.error('Error sending cleaning approved notifications:', error);
  }
};

const notifyCleaningDue = async (studentId) => {
  try {
    const student = await User.findById(studentId);
    if (!student) return;
    
    await createNotification(
      studentId,
      'cleaning_due',
      'Room Cleaning Due',
      `Your room ${student.roomNumber} is due for cleaning. You can now request a cleaning service.`,
      {},
      'push'
    );
  } catch (error) {
    console.error('Error sending cleaning due notification:', error);
  }
};

// API endpoints for notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const totalNotifications = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });
    
    res.json({
      notifications,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true }
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Cron job for checking due dates and sending reminders
const checkDueDatesAndNotify = async () => {
  try {
    const students = await User.find({ role: 'student' });
    
    for (const student of students) {
      const lastApproved = await CleaningRequest.findOne({
        student: student._id,
        status: 'approved'
      }).sort({ approvedDate: -1 });
      
      if (!lastApproved) {
        // New student, can request immediately
        continue;
      }
      
      const daysSinceLastCleaning = (Date.now() - lastApproved.approvedDate) / (1000 * 60 * 60 * 24);
      
      // Check if we already sent a notification today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const notificationSentToday = await Notification.findOne({
        recipient: student._id,
        type: { $in: ['cleaning_due', 'reminder'] },
        createdAt: { $gte: today }
      });
      
      if (notificationSentToday) continue;
      
      // Notify when due (7 days)
      if (Math.floor(daysSinceLastCleaning) === 7) {
        await notifyCleaningDue(student._id);
      }
      
      // Send reminder if overdue (every day after 7 days)
      if (daysSinceLastCleaning > 7) {
        const daysOverdue = Math.floor(daysSinceLastCleaning) - 7;
        await createNotification(
          student._id,
          'reminder',
          `Cleaning Overdue - ${daysOverdue} day(s)`,
          `Your room ${student.roomNumber} cleaning is ${daysOverdue} day(s) overdue. Please request cleaning service.`,
          {},
          'push'
        );
      }
    }
  } catch (error) {
    console.error('Error checking due dates:', error);
  }
};

module.exports = {
  createNotification,
  notifyCleaningRequested,
  notifyCleaningCompleted,
  notifyCleaningApproved,
  notifyCleaningDue,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  checkDueDatesAndNotify
};