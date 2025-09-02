const CleaningRequest = require("../models/CleaningRequest");
const User = require("../models/User");
const {
  notifyCleaningRequested,
  notifyCleaningApproved,
} = require("./notificationController");

exports.requestCleaning = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const student = await User.findById(studentId).populate("assignedSweeper");

    // if (!student.assignedSweeper) {
    const sweeper = await User.findOne({
      role: "sweeper",
      hostelNumber: student.hostelNumber,
    });

    const sweeperId = sweeper._id;

    
   

    // Check if it's been more than a week since last cleaning
    const lastRequest = await CleaningRequest.findOne({
      student: studentId,
      status: "approved",
    }).sort({ approvedDate: -1 });

    if (lastRequest) {
      const daysSinceLastCleaning =
        (Date.now() - lastRequest.approvedDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastCleaning < 7) {
        return res.status(400).json({
          message: `You can request cleaning after ${Math.ceil(
            7 - daysSinceLastCleaning
          )} more days`,
        });
      }
    }

   

    // Check for pending requests
    const pendingRequest = await CleaningRequest.findOne({
      student: studentId,
      status: { $in: ["pending", "in-progress", "completed"] },
    });
  
 


    if (pendingRequest) {
      return res
        .status(400)
        .json({ message: "You already have a pending cleaning request" });
    }

    
    const cleaningRequest = new CleaningRequest({
      student: studentId,
      sweeper: student.assignedSweeper===null?sweeperId:student.assignedSweeper._id,
      roomNumber: student.roomNumber,
      hostelNumber: student.hostelNumber,
    });

    await cleaningRequest.save();

    // Send notifications
    await notifyCleaningRequested(cleaningRequest._id);

    res
      .status(201)
      .json({ message: "Cleaning request submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveCleaningCompletion = async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.user.userId;

    const request = await CleaningRequest.findOne({
      _id: requestId,
      student: studentId,
      status: "completed",
    });

    if (!request) {
      return res
        .status(404)
        .json({ message: "Request not found or not ready for approval" });
    }

    request.status = "approved";
    request.approvedDate = new Date();
    await request.save();

    // Send notification to sweeper
    await notifyCleaningApproved(requestId);

    res.json({ message: "Cleaning completion approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Keep existing getCleaningHistory method unchanged

// Updated controllers/sweeperController.js - Add notification triggers
// const CleaningRequest = require('../models/CleaningRequest');
// const User = require('../models/User');
// const { notifyCleaningCompleted } = require('./notificationController');

exports.markRoomCleaned = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sweeperId = req.user.userId;

    const request = await CleaningRequest.findOne({
      _id: requestId,
      sweeper: sweeperId,
      status: { $in: ["pending", "in-progress"] },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "completed";
    request.completedDate = new Date();
    await request.save();

    // Send notification to student for approval
    await notifyCleaningCompleted(requestId);

    res.json({
      message: "Room marked as cleaned. Waiting for student approval.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Keep existing getPendingRooms and getCleaningHistory methods unchanged

exports.getCleaningHistory = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const requests = await CleaningRequest.find({ student: studentId })
      .populate("sweeper", "name collegeId")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
