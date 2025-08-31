const CleaningRequest = require('../models/CleaningRequest');
const User = require('../models/User');

exports.getAllPendingRooms = async (req, res) => {
  try {
    const requests = await CleaningRequest.find({
      status: { $in: ['pending', 'in-progress', 'completed'] }
    }).populate('student', 'name collegeId roomNumber hostelNumber')
      .populate('sweeper', 'name collegeId floorNumber')
      .sort({ createdAt: 1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').populate('assignedSweeper', 'name collegeId');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalSweepers = await User.countDocuments({ role: 'sweeper' });
    const pendingRequests = await CleaningRequest.countDocuments({ 
      status: { $in: ['pending', 'in-progress'] } 
    });
    const completedRequests = await CleaningRequest.countDocuments({ status: 'approved' });

    res.json({
      totalStudents,
      totalSweepers,
      pendingRequests,
      completedRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};