import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import TX from "../components/TranslatedText";
import "./Dashboard.css";

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    total: 0,
    full: 0,
    half: 0,
    empty: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/analytics/bins");
      setStats({
        total: response.data.total_bins || 0,
        full: response.data.full_bins || 0,
        half: response.data.active_bins || 0,
        empty: response.data.empty_bins || 0,
      });
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("role-limited");
      } else {
        setError("unavailable");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";
  const isCollector = user?.role === "collector";

  const quickLinks = isCollector
    ? [
        { to: "/bins",        label: "View bin status" },
        { to: "/collections", label: "Open collection jobs" },
        { to: "/map",         label: "Assigned map issues" },
      ]
    : isAdmin
      ? [
          { to: "/bins",          label: "Manage bins" },
          { to: "/collections",   label: "Schedule collections" },
          { to: "/notifications", label: "Review notifications" },
        ]
      : [
          { to: "/bins",   label: "Check nearby bins" },
          { to: "/issues", label: "Report an issue" },
          { to: "/map",    label: "Pin a location on the map" },
        ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <p><TX>Loading dashboard...</TX></p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="dashboard-top">
        <div className="dashboard-hero-copy">
          <div className="dashboard-hero-inner">
            <h1>
              {isAdmin && (
                <TX>Track live bin levels, overflow alerts, and field response.</TX>
              )}
              {isCollector && (
                <TX>Check live bin readings and move through assigned pickup work.</TX>
              )}
              {!isAdmin && !isCollector && (
                <TX>Monitor smart bins, report issues, and follow cleanup updates.</TX>
              )}
            </h1>
            <p>
              {isAdmin && (
                <TX>
                  The ultrasonic bin monitor updates the system with FULL, HALF,
                  and EMPTY readings so collection teams can act before overflow
                  spreads.
                </TX>
              )}
              {isCollector && (
                <TX>
                  Distance readings from the ultrasonic sensor mark bins as FULL,
                  HALF, or EMPTY to help you prioritize the next collection stop.
                </TX>
              )}
              {!isAdmin && !isCollector && (
                <TX>
                  Smart bins report live fill conditions using ultrasonic distance
                  readings, so you can quickly see when a location needs attention.
                </TX>
              )}
            </p>
          </div>
        </div>

        <div className="dashboard-actions-card">
          <div className="quick-links">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to} className="btn btn-primary">
                <TX>{link.label}</TX>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {error !== "role-limited" && !error && (
        <section className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">🗑️</div>
            <div className="stat-content">
              <h3><TX>Total bins</TX></h3>
              <p className="stat-number">{stats.total}</p>
            </div>
          </div>

          <div className="stat-card full">
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <h3><TX>Full bins</TX></h3>
              <p className="stat-number">{stats.full}</p>
            </div>
          </div>

          <div className="stat-card active">
            <div className="stat-icon">🟡</div>
            <div className="stat-content">
              <h3><TX>Half bins</TX></h3>
              <p className="stat-number">{stats.half}</p>
            </div>
          </div>

          <div className="stat-card empty">
            <div className="stat-icon">⚪</div>
            <div className="stat-content">
              <h3><TX>Empty bins</TX></h3>
              <p className="stat-number">{stats.empty}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;