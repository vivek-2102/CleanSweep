const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const sweeperRoutes = require('./routes/sweeper');
const notificationRoutes = require('./routes/notifications');
const { checkDueDatesAndNotify } = require('./controllers/notificationController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/room-cleaning', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/sweeper', sweeperRoutes);
app.use('/api/notifications', notificationRoutes);

// // Set up cron job to check due dates daily at 9 AM
// cron.schedule('0 9 * * *', () => {
//   console.log('Running daily due date check...');
//   checkDueDatesAndNotify();
// });

// // Also run check every hour during the day (9 AM to 9 PM)
// cron.schedule('0 9-21 * * *', () => {
//   console.log('Running hourly reminder check...');
//   checkDueDatesAndNotify();
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const path = require('path');

// Serve static files from the React app
const frontendPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

 