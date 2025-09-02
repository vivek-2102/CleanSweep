const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { findById } = require('./notificationController');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

exports.login = async (req, res) => {
  try {
    const { collegeId, password } = req.body;

    const user = await User.findOne({ collegeId }).populate('assignedSweeper');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    
    res.json({
      token,
      user: {
        id: user._id,
        collegeId: user.collegeId,
        name: user.name,
        role: user.role,
        hostelNumber: user.hostelNumber,
        roomNumber: user.roomNumber,
        floorNumber: user.floorNumber,
        assignedSweeper: user.assignedSweeper
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { collegeId, name, password, role, hostelNumber, roomNumber, floorNumber } = req.body;

    const existingUser = await User.findOne({ collegeId });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userData = {
      collegeId,
      name,
      password,
      role,
      hostelNumber
    };

    if (role === 'student') {
      userData.roomNumber = roomNumber;
      
      // Assign sweeper based on floor
      const floorNum = parseInt(roomNumber.charAt(0));
      const sweeper = await User.findOne({ role: 'sweeper', floorNumber: floorNum });
      if (sweeper) {
        userData.assignedSweeper = sweeper._id;
      }
    } else if (role === 'sweeper') {
      userData.floorNumber = floorNumber;
    }

    const user = new User(userData);
    await user.save();
    if (role === "sweeper") {
      await User.updateMany(
        {
          role: "student",
          hostelNumber: userData.hostelNumber,
          roomNumber: { $regex: `^${floorNumber}` }  // students on same floor
        },
        {
          $set: { assignedSweeper: user._id }  // assign sweeper
        }
      );
    }

    const token = generateToken(user._id);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        collegeId: user.collegeId,
        name: user.name,
        role: user.role,
        hostelNumber: user.hostelNumber,
        roomNumber: user.roomNumber,
        floorNumber: user.floorNumber
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};