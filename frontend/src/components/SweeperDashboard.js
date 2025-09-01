
// Updated src/components/SweeperDashboard.js with Calendar and Notifications
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CalendarView from './CalendarView';
import { NotificationBell } from './NotificationCenter';

function SweeperDashboard() {
  const [pendingRooms, setPendingRooms] = useState([]);
  const [cleaningHistory, setCleaningHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [message, setMessage] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchPendingRooms();
    fetchCleaningHistory();
  }, []);

  const fetchPendingRooms = async () => {
    try {
      const response = await api.get('/sweeper/pending-rooms');
      setPendingRooms(response.data);
    } catch (error) {
      console.error('Error fetching pending rooms:', error);
    }
  };

  const fetchCleaningHistory = async () => {
    try {
      const response = await api.get('/sweeper/cleaning-history');
      setCleaningHistory(response.data);
    } catch (error) {
      console.error('Error fetching cleaning history:', error);
    }
  };

  const markRoomCleaned = async (requestId) => {
    try {
      await api.put(`/sweeper/mark-cleaned/${requestId}`);
      setMessage('Room marked as cleaned! Waiting for student approval.');
      fetchPendingRooms();
      fetchCleaningHistory();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error marking room as cleaned');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'in-progress': return '#2196f3';
      case 'completed': return '#ff9800';
      case 'approved': return '#4caf50';
      default: return '#666';
    }
  };

  const getTodaysCompletions = () => {
    const today = new Date().toDateString();
    return cleaningHistory.filter(request => {
      const completedDate = request.completedDate ? new Date(request.completedDate).toDateString() : null;
      return completedDate === today;
    }).length;
  };

  const getWeeklyCompletions = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return cleaningHistory.filter(request => {
      const completedDate = request.completedDate ? new Date(request.completedDate) : null;
      return completedDate && completedDate >= oneWeekAgo;
    }).length;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Sweeper Dashboard</h1>
        <div className="user-info">
          <NotificationBell />
          <span>Welcome, {user.name}</span>
          <span>Floor: {user.floorNumber}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-nav">
        <button 
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Rooms ({pendingRooms.length})
        </button>
        <button 
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar View
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Cleaning History
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          My Stats
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="dashboard-content">
        {activeTab === 'pending' && (
          <div className="pending-rooms">
            <h3>Rooms Pending Cleaning</h3>
            {pendingRooms.length === 0 ? (
              <div className="no-pending">
                <div className="no-pending-icon">🎉</div>
                <p>Great job! No pending rooms to clean.</p>
              </div>
            ) : (
              <div className="rooms-grid">
                {pendingRooms.map(request => (
                  <div key={request._id} className="room-card">
                    <div className="room-header">
                      <h4>Room {request.student.roomNumber}</h4>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {request.status}
                      </span>
                    </div>
                    <div className="room-details">
                      <p><strong>Student:</strong> {request.student.name}</p>
                      <p><strong>Hostel:</strong> {request.student.hostelNumber}</p>
                      <p><strong>Requested:</strong> {new Date(request.requestDate).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => markRoomCleaned(request._id)}
                      className="clean-btn"
                      disabled={request.status === 'completed'}
                    >
                      {request.status === 'completed' ? 'Awaiting Approval' : 'Mark as Cleaned'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView />
        )}

        {activeTab === 'stats' && (
          <div className="sweeper-stats">
            <h3>My Performance Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Today's Completions</h4>
                <p className="stat-number">{getTodaysCompletions()}</p>
              </div>
              <div className="stat-card">
                <h4>This Week's Completions</h4>
                <p className="stat-number">{getWeeklyCompletions()}</p>
              </div>
              <div className="stat-card">
                <h4>Total Approved Cleanings</h4>
                <p className="stat-number">
                  {cleaningHistory.filter(req => req.status === 'approved').length}
                </p>
              </div>
              <div className="stat-card">
                <h4>Pending Approval</h4>
                <p className="stat-number">
                  {cleaningHistory.filter(req => req.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="cleaning-history">
            <h3>Cleaning History</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Room Number</th>
                    <th>Hostel</th>
                    <th>Request Date</th>
                    <th>Completed Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cleaningHistory.map(request => (
                    <tr key={request._id}>
                      <td>{request.student.name}</td>
                      <td>{request.student.roomNumber}</td>
                      <td>{request.student.hostelNumber}</td>
                      <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                      <td>
                        {request.completedDate ? 
                          new Date(request.completedDate).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SweeperDashboard;