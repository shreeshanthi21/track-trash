import { useEffect, useState } from "react";
import api from "../services/api";
import "./Bins.css";

function Bins() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFill, setEditFill] = useState("");

  useEffect(() => {
    fetchBins();
  }, []);

  const fetchBins = async () => {
    try {
      const res = await api.get("/bins");
      setBins(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load bins");
      setLoading(false);
      console.error(err);
    }
  };

  const handleUpdateFill = async (id, currentFill) => {
    try {
      await api.put(`/bins/${id}`, { current_fill: parseInt(editFill) });
      setBins(bins.map(b => 
        b.id === id ? { ...b, current_fill: parseInt(editFill) } : b
      ));
      setEditingId(null);
      setEditFill("");
    } catch (err) {
      console.error("Failed to update bin fill", err);
      setError("Failed to update bin");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "full":
        return "full";
      case "empty":
        return "empty";
      case "active":
        return "active";
      default:
        return "inactive";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "full":
        return "🔴";
      case "empty":
        return "⚪";
      case "active":
        return "🟢";
      default:
        return "❓";
    }
  };

  if (loading) return <div className="bins-container"><p>Loading bins...</p></div>;
  if (error) return <div className="bins-container"><p className="error">{error}</p></div>;
  if (bins.length === 0) return <div className="bins-container"><p>No bins found</p></div>;

  return (
    <div className="bins-container">
      <div className="page-header">
        <h1>🗑️ Bin Monitoring</h1>
        <p>Track the status and fill levels of all waste bins</p>
      </div>

      <div className="bins-grid">
        {bins.map((bin) => (
          <div key={bin.id} className={`bin-card ${getStatusColor(bin.status)}`}>
            <div className="bin-card-header">
              <span className="bin-status-icon">{getStatusIcon(bin.status)}</span>
              <span className="bin-id">Bin #{bin.id}</span>
            </div>

            <div className="bin-fill-level">
              <div className="fill-bar-container">
                <div
                  className="fill-bar"
                  style={{
                    width: `${bin.current_fill || 0}%`,
                    backgroundColor:
                      bin.status === "full"
                        ? "#ef4444"
                        : bin.status === "active"
                        ? "#10b981"
                        : "#cbd5e1"
                  }}
                ></div>
              </div>
              <span className="fill-percentage">{bin.current_fill || 0}%</span>
            </div>

            <div className="bin-details">
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">{bin.status || "Unknown"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">{bin.location || "N/A"}</span>
              </div>
            </div>

            <div className="bin-card-footer">
              {editingId === bin.id ? (
                <div className="edit-fill-section">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editFill}
                    onChange={(e) => setEditFill(e.target.value)}
                    placeholder="Enter fill %"
                    className="fill-input"
                  />
                  <button
                    className="btn-small btn-primary"
                    onClick={() => handleUpdateFill(bin.id, bin.current_fill)}
                  >
                    Save
                  </button>
                  <button
                    className="btn-small btn-secondary"
                    onClick={() => {
                      setEditingId(null);
                      setEditFill("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn-small btn-primary"
                  onClick={() => {
                    setEditingId(bin.id);
                    setEditFill(bin.current_fill || "0");
                  }}
                >
                  Update Fill
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Bins;