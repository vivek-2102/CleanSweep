const CleaningRequest = require("../models/CleaningRequest");
const User = require("../models/User");

exports.getPendingRooms = async (req, res) => {
  try {
    const sweeperId = req.user.userId;
    console.log(sweeperId);
    const SweeperData = await User.findById(sweeperId);
    const hostel=SweeperData.hostelNumber;
    const requests = await CleaningRequest.find({
      hostelNumber: hostel,
      sweeper: sweeperId,
      status: { $in: ["pending", "in-progress"] },
    })
      .populate("student", "name collegeId roomNumber hostelNumber")
      .sort({ createdAt: 1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.markRoomCleaned = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sweeperId = req.user.userId;
    const SweeperData = await User.findById(sweeperId);
    const hostel=SweeperData.hostelNumber;

    const request = await CleaningRequest.findOne({
      hostelNumber: hostel,
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

    res.json({
      message: "Room marked as cleaned. Waiting for student approval.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCleaningHistory = async (req, res) => {
  try {
    const sweeperId = req.user.userId;
    const SweeperData = await User.findById(sweeperId);
    const hostel=SweeperData.hostelNumber;
    const requests = await CleaningRequest.find({
      hostelNumber: hostel,
      sweeper: sweeperId,
    })
      .populate("student", "name collegeId roomNumber hostelNumber")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
