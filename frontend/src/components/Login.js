import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    collegeId: '',
    password: '',
    name: '',
    role: 'student',
    hostelNumber: '',
    roomNumber: '',
    floorNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.collegeId, formData.password);
    
    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user'));
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'sweeper':
          navigate('/sweeper');
          break;
        default:
          navigate('/');
      }
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', formData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Navigate based on role
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'sweeper':
          navigate('/sweeper');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
    
    setLoading(false);
  };

  const fillDemoCredentials = (role) => {
    switch (role) {
      case 'admin':
        setFormData({ ...formData, collegeId: 'ADMIN001', password: 'admin123' });
        break;
      case 'student':
        setFormData({ ...formData, collegeId: 'STU001', password: 'student123' });
        break;
      case 'sweeper':
        setFormData({ ...formData, collegeId: 'SWP001', password: 'sweeper123' });
        break;
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Room Cleaning Service</h2>
        
        <div className="auth-tabs">
          <button 
            className={isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            type="button"
          >
            Login
          </button>
          <button 
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            type="button"
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>College ID:</label>
              <input
                type="text"
                name="collegeId"
                value={formData.collegeId}
                onChange={handleInputChange}
                placeholder="Enter your college ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading} className="auth-button">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-group">
              <label>College ID:</label>
              <input
                type="text"
                name="collegeId"
                value={formData.collegeId}
                onChange={handleInputChange}
                placeholder="Enter your college ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="student">Student</option>
                <option value="sweeper">Sweeper</option>
                <option value="admin">Admin</option>
              </select>
            </div>

              <div className="form-group">
                  <label>Hostel Number:</label>
                  <input
                    type="text"
                    name="hostelNumber"
                    value={formData.hostelNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., A, B, C"
                    required
                  />
                </div>
            
            {formData.role === 'student' && (
              <>
               
                <div className="form-group">
                  <label>Room Number:</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 101, 205"
                    required
                  />
                </div>
              </>
            )}
            
            {formData.role === 'sweeper' && (
              <div className="form-group">
                <label>Floor Number:</label>
                <input
                  type="number"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 1, 2, 3"
                  min="1"
                  required
                />
              </div>
            )}
            
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading} className="auth-button">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
        
        <div className="demo-credentials">
          <h4>🔑 Demo Credentials (Click to use):</h4>
          <div className="demo-buttons">
            <button 
              type="button" 
              onClick={() => fillDemoCredentials('admin')}
              className="demo-btn admin-btn"
            >
              Admin: ADMIN001
            </button>
            <button 
              type="button" 
              onClick={() => fillDemoCredentials('student')}
              className="demo-btn student-btn"
            >
              Student: STU001
            </button>
            <button 
              type="button" 
              onClick={() => fillDemoCredentials('sweeper')}
              className="demo-btn sweeper-btn"
            >
              Sweeper: SWP001
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;