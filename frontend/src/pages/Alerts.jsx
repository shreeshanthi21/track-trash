import { useEffect, useState } from "react";
import api from "../services/api";
import TX from "../components/TranslatedText";
import "./Alerts.css";

function getSeverityFromAlert(alert) {
  if (alert.alert_type === "OVERFLOW") return "critical";
  if (alert.alert_type === "USER_ALERT") return "warning";
  return "info";
}

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ bin_id: "", message: "" });
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "user";
    setUserRole(role);
    fetchAlerts(role);
    fetchBins();
  }, []);

  const fetchAlerts = async (role = userRole) => {
    try {
      const response =
        role === "admin" ? await api.get("/alerts") : await api.get("/alerts/my");
      setAlerts(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBins = async () => {
    try {
      const response = await api.get("/bins");
      setBins(response.data || []);
    } catch (err) {
      console.error("Failed to load bins:", err);
    }
  };

  const handleSubmitAlert = async (event) => {
    event.preventDefault();
    setFormMessage("");

    if (!formData.bin_id || !formData.message.trim()) {
      setFormMessage("Please select a bin and enter an alert message.");
      return;
    }

    try {
      await api.post("/alerts", {
        bin_id: Number(formData.bin_id),
        message: formData.message.trim(),
      });

      setFormMessage("Alert sent successfully.");
      setFormData({ bin_id: "", message: "" });

      setTimeout(() => {
        setShowForm(false);
        setFormMessage("");
        fetchAlerts();
      }, 1200);
    } catch (err) {
      setFormMessage(err.response?.data?.message || "Failed to send alert.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="alerts-container">
        <p><TX>Loading alerts...</TX></p>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <div className="page-header">
        <h1><TX>Alerts</TX></h1>
        <p>
          {userRole === "admin" ? (
            <TX>Monitor every alert generated across the system.</TX>
          ) : (
            <TX>Send manual alerts and review the ones you have submitted.</TX>
          )}
        </p>
      </div>

      {userRole !== "admin" && (
        <div className="alert-creation-section">
          {!showForm ? (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <TX>Send a new alert</TX>
            </button>
          ) : (
            <form className="alert-form" onSubmit={handleSubmitAlert}>
              {formMessage && (
                <div
                  className={
                    formMessage.toLowerCase().includes("success")
                      ? "success-message"
                      : "error-message"
                  }
                >
                  <TX>{formMessage}</TX>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="alert-bin"><TX>Bin</TX></label>
                <select
                  id="alert-bin"
                  value={formData.bin_id}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, bin_id: event.target.value }))
                  }
                  required
                >
                  <option value=""><TX>Select a bin</TX></option>
                  {bins.map((bin) => (
                    <option key={bin.id} value={bin.id}>
                      Bin #{bin.id} - {bin.location || "No location"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="alert-message"><TX>Alert message</TX></label>
                <input
                  id="alert-message"
                  type="text"
                  placeholder="What should the team know?"
                  value={formData.message}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, message: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  <TX>Send alert</TX>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowForm(false); setFormMessage(""); }}
                >
                  <TX>Cancel</TX>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && <p className="error"><TX>{error}</TX></p>}

      {alerts.length === 0 ? (
        <div className="empty-state">
          <p>
            {userRole === "admin" ? (
              <TX>No alerts in the system.</TX>
            ) : (
              <TX>You have not sent any alerts yet.</TX>
            )}
          </p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert) => {
            const severity = getSeverityFromAlert(alert);
            return (
              <div key={alert.id} className={`alert-item ${severity}`}>
                <div className="alert-header">
                  <span className="alert-icon">
                    {severity === "critical" ? "🔴" : severity === "warning" ? "🟠" : "🔵"}
                  </span>
                  <div className="alert-title-section">
                    <h3><TX>{alert.message || "Alert"}</TX></h3>
                    <p className="alert-bin">Bin #{alert.bin_id || "N/A"}</p>
                  </div>
                  <span className="alert-severity"><TX>{severity}</TX></span>
                </div>

                <div className="alert-body">
                  <p><TX>{alert.alert_type || "System alert"}</TX></p>
                </div>

                <div className="alert-footer">
                  <span className="alert-time">
                    {alert.created_at
                      ? new Date(alert.created_at).toLocaleString()
                      : "Unknown time"}
                  </span>
                  <span className={`status-badge ${alert.status?.toLowerCase() || "open"}`}>
                    <TX>{alert.status || "active"}</TX>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Alerts;