const CleaningRequest = require("../models/CleaningRequest");
const User = require("../models/User");

exports.getAllPendingRooms = async (req, res) => {
  try {
    const curr = await User.findById(req.user.userId);
    const hostel = curr.hostelNumber;
    const requests = await CleaningRequest.find({
      hostelNumber: hostel,
      status: { $in: ["pending", "in-progress", "completed"] },
    })
      .populate("student", "name collegeId roomNumber hostelNumber")
      .populate("sweeper", "name collegeId floorNumber")
      .sort({ createdAt: 1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const curr = await User.findById(req.user.userId);
    const hostel = curr.hostelNumber;
    const users = await User.find(
      { hostelNumber: hostel },
      "-password"
    ).populate("assignedSweeper", "name collegeId");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStats = async (req, res) => {
  try {
    const curr = await User.findById(req.user.userId);
    const hostel = curr.hostelNumber;
    const totalStudents = await User.countDocuments({
      hostelNumber: hostel,
      role: "student",
    });
    const totalSweepers = await User.countDocuments({
      hostelNumber: hostel,
      role: "sweeper",
    });
    const pendingRequests = await CleaningRequest.countDocuments({
      hostelNumber: hostel,
      status: { $in: ["pending", "in-progress", "completed"] },
    });
    const completedRequests = await CleaningRequest.countDocuments({
      hostelNumber: hostel,
      status: "approved",
    });

    res.json({
      totalStudents,
      totalSweepers,
      pendingRequests,
      completedRequests,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
