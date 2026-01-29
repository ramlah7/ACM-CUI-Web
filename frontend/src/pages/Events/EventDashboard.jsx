// EventDashboard.jsx
import React, { useState, useEffect } from 'react';
import { BsPeople, BsClock, BsCalendarCheck, BsCheckCircle, BsEye } from "react-icons/bs";
import axiosInstance from '../../axios';
import './EventDashboard.css';

const EventDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regsRes, eventsRes] = await Promise.all([
        axiosInstance.get('/events/registrations/'),
        axiosInstance.get('/events/')
      ]);
      setRegistrations(regsRes.data);
      setEvents(eventsRes.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalParticipants: registrations.reduce((sum, reg) => sum + (reg.participants?.length || 0), 0),
    totalEvents: events.length,
    pending: registrations.filter(r => r.status === 'PENDING').length,
    confirmed: registrations.filter(r => r.status === 'CONFIRMED').length,
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.participants?.some(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reg_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesEvent = !selectedEvent || reg.event === parseInt(selectedEvent);
    const matchesStatus = !selectedStatus || reg.status === selectedStatus;
    return matchesSearch && matchesEvent && matchesStatus;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.title : 'Unknown Event';
  };

  if (loading) {
    return (
      <div className="event-dashboard">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-dashboard">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#e74c3c' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>STUDENT WEEK EVENTS</h1>
        <p>Manage and track event registrations and participant data</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Participants</h3>
            <div className="stat-value">{stats.totalParticipants}</div>
            <div className="stat-sub">All time</div>
          </div>
          <div className="stat-icon">
            <BsPeople size={18} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Events</h3>
            <div className="stat-value">{stats.totalEvents}</div>
            <div className="stat-sub">Total events</div>
          </div>
          <div className="stat-icon">
            <BsCalendarCheck size={18} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Pending</h3>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-sub">{registrations.length > 0 ? Math.round((stats.pending / registrations.length) * 100) : 0}% pending</div>
          </div>
          <div className="stat-icon">
            <BsClock size={18} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Confirmed</h3>
            <div className="stat-value">{stats.confirmed}</div>
            <div className="stat-sub">{registrations.length > 0 ? Math.round((stats.confirmed / registrations.length) * 100) : 0}% confirmed</div>
          </div>
          <div className="stat-icon">
            <BsCheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="event-table-container">
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search by email, name, or registration"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <table className="event-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll No.</th>
              <th>Email</th>
              <th>Events</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No registrations found
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((reg) =>
                reg.participants?.map((participant, idx) => (
                  <tr key={`${reg.id}-${idx}`}>
                    <td>{participant.name}</td>
                    <td>{participant.reg_no}</td>
                    <td>{participant.email}</td>
                    <td>{getEventName(reg.event)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(reg.status)}`}>
                        {reg.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" title="View Details">
                        <BsEye />
                      </button>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventDashboard;
