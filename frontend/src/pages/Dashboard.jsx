import { useEffect, useState } from "react";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    full: 0,
    active: 0,
    empty: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/analytics/bins");
      // Map backend field names to frontend state
      setStats({
        total: res.data.total_bins || 0,
        full: res.data.full_bins || 0,
        active: res.data.active_bins || 0,
        empty: res.data.empty_bins || 0
      });
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Admin access required for dashboard stats");
      } else {
        setError("Failed to load dashboard stats");
      }
      setLoading(false);
      console.error(err);
    }
  };

  if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p>Smart Waste Management System Overview</p>
      </div>

      {error ? (
        <div className="welcome-section">
          <h2>Welcome to Track Trash</h2>
          <p>{error}</p>
          <p>Admin users can view detailed bin statistics. You can still access:</p>
          <div className="quick-links">
            <a href="/bins" className="btn btn-primary">View Bins</a>
            <a href="/issues" className="btn btn-secondary">Report Issues</a>
            <a href="/notifications" className="btn btn-secondary">Notifications</a>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>Total Bins</h3>
                <p className="stat-number">{stats.total || 0}</p>
              </div>
            </div>

            <div className="stat-card full">
              <div className="stat-icon">🔴</div>
              <div className="stat-content">
                <h3>Full Bins</h3>
                <p className="stat-number">{stats.full || 0}</p>
              </div>
            </div>

            <div className="stat-card active">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Active Bins</h3>
                <p className="stat-number">{stats.active || 0}</p>
              </div>
            </div>

            <div className="stat-card empty">
              <div className="stat-icon">⚪</div>
              <div className="stat-content">
                <h3>Empty Bins</h3>
                <p className="stat-number">{stats.empty || 0}</p>
              </div>
            </div>
          </div>

          <div className="welcome-section">
            <h2>Welcome to Track Trash</h2>
            <p>Manage your smart waste bins efficiently. Monitor fill levels, track collections, and stay updated with alerts.</p>
            <div className="quick-links">
              <a href="/bins" className="btn btn-primary">View Bins</a>
              <a href="/collections" className="btn btn-secondary">View Collections</a>
              <a href="/notifications" className="btn btn-secondary">Notifications</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;