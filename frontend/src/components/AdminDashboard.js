import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function AdminDashboard() {
  const [pendingRooms, setPendingRooms] = useState([]);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, statsRes, usersRes] = await Promise.all([
        api.get('/admin/pending-rooms'),
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);
      
      setPendingRooms(pendingRes.data);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
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
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Cleaning Requests
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Students</h3>
                <p>{stats.totalStudents}</p>
              </div>
              <div className="stat-card">
                <h3>Total Sweepers</h3>
                <p>{stats.totalSweepers}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Requests</h3>
                <p>{stats.pendingRequests}</p>
              </div>
              <div className="stat-card">
                <h3>Completed Requests</h3>
                <p>{stats.completedRequests}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests">
            <h3>All Cleaning Requests</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Room</th>
                    <th>Hostel</th>
                    <th>Sweeper</th>
                    <th>Status</th>
                    <th>Request Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRooms.map(request => (
                    <tr key={request._id}>
                      <td>{request.student.name}</td>
                      <td>{request.roomNumber}</td>
                      <td>{request.hostelNumber}</td>
                      <td>{request.sweeper.name}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users">
            <h3>All Users</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>College ID</th>
                    <th>Role</th>
                    <th>Room/Floor</th>
                    <th>Hostel</th>
                    <th>Assigned Sweeper</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.collegeId}</td>
                      <td>{user.role}</td>
                      <td>
                        {user.role === 'student' ? user.roomNumber : 
                         user.role === 'sweeper' ? `Floor ${user.floorNumber}` : '-'}
                      </td>
                      <td>{user.hostelNumber || '-'}</td>
                      <td>{user.assignedSweeper?.name || '-'}</td>
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

export default AdminDashboard;