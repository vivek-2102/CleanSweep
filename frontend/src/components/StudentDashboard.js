// Updated src/components/StudentDashboard.js with Calendar and Notifications
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CalendarView from './CalendarView';
import { NotificationBell } from './NotificationCenter';

function StudentDashboard() {
  const [cleaningHistory, setCleaningHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchCleaningHistory();
  }, []);

  const fetchCleaningHistory = async () => {
    try {
      const response = await api.get('/student/cleaning-history');
      setCleaningHistory(response.data);
    } catch (error) {
      console.error('Error fetching cleaning history:', error);
    }
  };

  const requestCleaning = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await api.post('/student/request-cleaning');
      setMessage('Cleaning request submitted successfully!');
      fetchCleaningHistory();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting request');
    }
    
    setLoading(false);
  };

  const approveCleaning = async (requestId) => {
    try {
      await api.put(`/student/approve-cleaning/${requestId}`);
      setMessage('Cleaning completion approved!');
      fetchCleaningHistory();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error approving cleaning');
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

  const canRequestCleaning = () => {
    const lastApproved = cleaningHistory.find(req => req.status === 'approved');
    if (!lastApproved) return true;
    
    const daysSince = (Date.now() - new Date(lastApproved.approvedDate)) / (1000 * 60 * 60 * 24);
    return daysSince >= 7;
  };

  const hasPendingRequest = () => {
    return cleaningHistory.some(req => ['pending', 'in-progress', 'completed'].includes(req.status));
  };

  const getNextDueDate = () => {
    const lastApproved = cleaningHistory
      .filter(req => req.status === 'approved')
      .sort((a, b) => new Date(b.approvedDate) - new Date(a.approvedDate))[0];
    
    if (!lastApproved) return new Date();
    
    const nextDue = new Date(lastApproved.approvedDate);
    nextDue.setDate(nextDue.getDate() + 7);
    return nextDue;
  };

  const getDaysUntilDue = () => {
    const nextDue = getNextDueDate();
    const today = new Date();
    const diffTime = nextDue - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <NotificationBell />
          <span>Welcome, {user.name}</span>
          <span>Room: {user.roomNumber}, Hostel: {user.hostelNumber}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-nav">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
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
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <>
            <div className="student-actions">
              <div className="action-card">
                <h3>Request Room Cleaning</h3>
                <p>You can request cleaning if it's been more than a week since your last approved cleaning.</p>
                
                <div className="cleaning-status">
                  {getDaysUntilDue() <= 0 ? (
                    <div className="status-available">
                      <span className="status-icon">✅</span>
                      <span>Cleaning available now!</span>
                    </div>
                  ) : (
                    <div className="status-waiting">
                      <span className="status-icon">⏰</span>
                      <span>Next cleaning in {getDaysUntilDue()} day(s)</span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={requestCleaning}
                  disabled={loading || !canRequestCleaning() || hasPendingRequest()}
                  className="request-btn"
                >
                  {loading ? 'Requesting...' : 'Request Cleaning'}
                </button>
                {!canRequestCleaning() && !hasPendingRequest() && (
                  <p className="warning">You can request cleaning after a week from last approved cleaning.</p>
                )}
                {hasPendingRequest() && (
                  <p className="warning">You already have a pending cleaning request.</p>
                )}
              </div>
              
              {user.assignedSweeper && (
                <div className="sweeper-info">
                  <h3>Your Assigned Sweeper</h3>
                  <p>Name: {user.assignedSweeper.name}</p>
                  <p>ID: {user.assignedSweeper.collegeId}</p>
                  
                  <div className="next-due-info">
                    <h4>Next Cleaning Due:</h4>
                    <p className="due-date">
                      {getNextDueDate().toLocaleDateString()}
                      {getDaysUntilDue() <= 0 && <span className="overdue-badge">Due Now!</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {message && (
              <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="recent-activity">
              <h3>Recent Cleaning Activity</h3>
              <div className="activity-cards">
                {cleaningHistory.slice(0, 3).map(request => (
                  <div key={request._id} className="activity-card">
                    <div className="activity-header">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {request.status}
                      </span>
                      <span className="activity-date">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p>Sweeper: {request.sweeper.name}</p>
                    {request.status === 'completed' && (
                      <button 
                        onClick={() => approveCleaning(request._id)}
                        className="approve-btn"
                      >
                        Approve Cleaning
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'calendar' && (
          <CalendarView />
        )}

        {activeTab === 'history' && (
          <div className="cleaning-history">
            <h3>Complete Cleaning History</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Request Date</th>
                    <th>Sweeper</th>
                    <th>Status</th>
                    <th>Completed Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cleaningHistory.map(request => (
                    <tr key={request._id}>
                      <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                      <td>{request.sweeper.name}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {request.completedDate ? 
                          new Date(request.completedDate).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        {request.status === 'completed' && (
                          <button 
                            onClick={() => approveCleaning(request._id)}
                            className="approve-btn"
                          >
                            Approve
                          </button>
                        )}
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

export default StudentDashboard;