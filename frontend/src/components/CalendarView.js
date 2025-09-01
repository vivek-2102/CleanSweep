// src/components/CalendarView.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './CalendarView.css';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cleaningData, setCleaningData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCleaningData();
  }, [currentDate]);

  const fetchCleaningData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      switch (user.role) {
        case 'student':
          endpoint = '/student/cleaning-history';
          break;
        case 'sweeper':
          endpoint = '/sweeper/cleaning-history';
          break;
        case 'admin':
          endpoint = '/admin/pending-rooms';
          break;
      }
      
      const response = await api.get(endpoint);
      setCleaningData(response.data);
    } catch (error) {
      console.error('Error fetching cleaning data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar utility functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getCleaningForDate = (date) => {
    const dateStr = formatDate(date);
    return cleaningData.filter(cleaning => {
      const requestDate = cleaning.requestDate ? formatDate(new Date(cleaning.requestDate)) : null;
      const completedDate = cleaning.completedDate ? formatDate(new Date(cleaning.completedDate)) : null;
      const approvedDate = cleaning.approvedDate ? formatDate(new Date(cleaning.approvedDate)) : null;
      
      return requestDate === dateStr || completedDate === dateStr || approvedDate === dateStr;
    });
  };

  const getNextDueDate = () => {
    if (user.role !== 'student') return null;
    
    const lastApproved = cleaningData
      .filter(req => req.status === 'approved')
      .sort((a, b) => new Date(b.approvedDate) - new Date(a.approvedDate))[0];
    
    if (!lastApproved) return new Date(); // Can request immediately if no history
    
    const nextDue = new Date(lastApproved.approvedDate);
    nextDue.setDate(nextDue.getDate() + 7);
    return nextDue;
  };

  const isDateDue = (date) => {
    const nextDue = getNextDueDate();
    if (!nextDue) return false;
    
    return formatDate(date) === formatDate(nextDue);
  };

  const isDateOverdue = (date) => {
    const nextDue = getNextDueDate();
    if (!nextDue) return false;
    
    return date > nextDue && formatDate(date) === formatDate(new Date());
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const cleaningsForDay = getCleaningForDate(date);
      const isDue = isDateDue(date);
      const isOverdue = isDateOverdue(date);
      const isToday = formatDate(date) === formatDate(new Date());
      const isSelected = selectedDate && formatDate(date) === formatDate(selectedDate);

      days.push(
        <div 
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${isDue ? 'due' : ''} ${isOverdue ? 'overdue' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="day-number">{day}</span>
          {cleaningsForDay.length > 0 && (
            <div className="cleaning-indicators">
              {cleaningsForDay.map((cleaning, index) => (
                <div 
                  key={index}
                  className={`indicator ${cleaning.status}`}
                  title={`${cleaning.status} - ${user.role === 'admin' ? cleaning.student?.name : cleaning.sweeper?.name || 'Unknown'}`}
                />
              ))}
            </div>
          )}
          {isDue && <div className="due-indicator">Due</div>}
          {isOverdue && <div className="overdue-indicator">Overdue</div>}
        </div>
      );
    }

    return days;
  };

  const renderSelectedDateDetails = () => {
    if (!selectedDate) return null;

    const cleaningsForDay = getCleaningForDate(selectedDate);
    
    return (
      <div className="selected-date-details">
        <h3>Details for {selectedDate.toLocaleDateString()}</h3>
        {cleaningsForDay.length === 0 ? (
          <p>No cleaning activities on this date.</p>
        ) : (
          <div className="cleaning-list">
            {cleaningsForDay.map((cleaning, index) => (
              <div key={index} className="cleaning-item">
                <div className="cleaning-info">
                  <span className={`status-badge ${cleaning.status}`}>
                    {cleaning.status}
                  </span>
                  {user.role === 'admin' && (
                    <>
                      <span>Student: {cleaning.student?.name}</span>
                      <span>Room: {cleaning.roomNumber}</span>
                      <span>Hostel: {cleaning.hostelNumber}</span>
                      <span>Sweeper: {cleaning.sweeper?.name}</span>
                    </>
                  )}
                  {user.role === 'student' && (
                    <span>Sweeper: {cleaning.sweeper?.name}</span>
                  )}
                  {user.role === 'sweeper' && (
                    <>
                      <span>Student: {cleaning.student?.name}</span>
                      <span>Room: {cleaning.student?.roomNumber}</span>
                    </>
                  )}
                </div>
                <div className="cleaning-dates">
                  <small>Requested: {new Date(cleaning.requestDate).toLocaleDateString()}</small>
                  {cleaning.completedDate && (
                    <small>Completed: {new Date(cleaning.completedDate).toLocaleDateString()}</small>
                  )}
                  {cleaning.approvedDate && (
                    <small>Approved: {new Date(cleaning.approvedDate).toLocaleDateString()}</small>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)} className="nav-button">
          &#8249;
        </button>
        <h2>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => navigateMonth(1)} className="nav-button">
          &#8250;
        </button>
      </div>

      {user.role === 'student' && (
        <div className="next-due-info">
          <div className="due-date-card">
            <h4>Next Cleaning Due:</h4>
            <p className="due-date">
              {getNextDueDate() ? getNextDueDate().toLocaleDateString() : 'Available Now'}
            </p>
            {isDateOverdue(new Date()) && (
              <p className="overdue-warning">⚠️ Cleaning is overdue!</p>
            )}
          </div>
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color pending"></div>
          <span>Pending</span>
        </div>
        <div className="legend-item">
          <div className="legend-color in-progress"></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color approved"></div>
          <span>Approved</span>
        </div>
        <div className="legend-item">
          <div className="legend-color due"></div>
          <span>Due Date</span>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="days-grid">
          {renderCalendarDays()}
        </div>
      </div>

      {renderSelectedDateDetails()}
    </div>
  );
};

export default CalendarView;