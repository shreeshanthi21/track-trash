import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import TX from "../components/TranslatedText";
import "./Bins.css";

function getHardwareStatus(bin) {
  return (
    bin.sensor_status ||
    (bin.status === "full" ? "FULL" : bin.status === "active" ? "HALF" : "EMPTY")
  );
}

function getStatusColor(sensorStatus) {
  switch (sensorStatus) {
    case "FULL":    return "full";
    case "HALF":    return "half";
    case "EMPTY":   return "empty";
    default:        return "inactive";
  }
}

function getStatusIcon(sensorStatus) {
  switch (sensorStatus) {
    case "FULL":  return "🔴";
    case "HALF":  return "🟡";
    case "EMPTY": return "⚪";
    default:      return "❔";
  }
}

function Bins() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFill, setEditFill] = useState("");

  useEffect(() => {
    fetchBins();

    const socket = io("http://localhost:5001");

    socket.on("sensorData", (data) => {
      setBins((currentBins) =>
        currentBins.map((bin) =>
          Number(bin.id) === Number(data.bin_id)
            ? {
                ...bin,
                latest_distance_cm: data.distance_cm,
                sensor_status: data.sensor_status,
                current_fill: data.fill_level,
                status: data.status,
              }
            : bin
        )
      );
    });

    return () => socket.disconnect();
  }, []);

  const fetchBins = async () => {
    try {
      const response = await api.get("/bins");
      setBins(response.data || []);
    } catch (err) {
      setError("Failed to load bins");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFill = async (id) => {
    try {
      const newFill = parseInt(editFill, 10);
      await api.put(`/bins/${id}`, { current_fill: newFill });

      setBins((current) =>
        current.map((bin) =>
          bin.id === id
            ? {
                ...bin,
                current_fill: newFill,
                sensor_status: newFill >= 80 ? "FULL" : newFill > 0 ? "HALF" : "EMPTY",
                status: newFill >= 80 ? "full" : newFill > 0 ? "active" : "empty",
              }
            : bin
        )
      );

      setEditingId(null);
      setEditFill("");
    } catch (err) {
      console.error("Failed to update bin fill", err);
      setError("Failed to update bin");
    }
  };

  if (loading) {
    return (
      <div className="bins-container">
        <p><TX>Loading bins...</TX></p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bins-container">
        <p className="error"><TX>{error}</TX></p>
      </div>
    );
  }

  if (!bins.length) {
    return (
      <div className="bins-container">
        <p><TX>No bins found</TX></p>
      </div>
    );
  }

  return (
    <div className="bins-container">
      <div className="page-header">
        <h1><TX>Bin monitoring</TX></h1>
      </div>

      <div className="bins-grid">
        {bins.map((bin) => {
          const sensorStatus = getHardwareStatus(bin);

          return (
            <div key={bin.id} className={`bin-card ${getStatusColor(sensorStatus)}`}>
              <div className="bin-card-header">
                <div>
                  <span className="bin-id">Bin #{bin.id}</span>
                  <p className="bin-location">
                    <TX>{bin.location || "No location"}</TX>
                  </p>
                </div>
                <span className="bin-status-chip">
                  {getStatusIcon(sensorStatus)} <TX>{sensorStatus}</TX>
                </span>
              </div>

              <div className="bin-reading-panel">
                <div className="reading-card">
                  <span className="reading-label"><TX>Sensor distance</TX></span>
                  <strong className="reading-value">
                    {bin.latest_distance_cm !== null && bin.latest_distance_cm !== undefined
                      ? `${Number(bin.latest_distance_cm).toFixed(2)} cm`
                      : <TX>No data</TX>}
                  </strong>
                </div>

                <div className="reading-card">
                  <span className="reading-label"><TX>Fill level</TX></span>
                  <strong className="reading-value">{bin.current_fill || 0}%</strong>
                </div>
              </div>

              <div className="bin-fill-level">
                <div className="fill-bar-container">
                  <div className="fill-bar" style={{ width: `${bin.current_fill || 0}%` }} />
                </div>
              </div>

              <div className="bin-details">
                <div className="detail-item">
                  <span className="detail-label"><TX>State</TX></span>
                  <span className="detail-value"><TX>{sensorStatus}</TX></span>
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
                      onChange={(event) => setEditFill(event.target.value)}
                      placeholder="Enter fill %"
                      className="fill-input"
                    />
                    <button
                      className="btn-small btn-primary"
                      onClick={() => handleUpdateFill(bin.id)}
                    >
                      <TX>Save</TX>
                    </button>
                    <button
                      className="btn-small btn-secondary"
                      onClick={() => { setEditingId(null); setEditFill(""); }}
                    >
                      <TX>Cancel</TX>
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
                    <TX>Manual update</TX>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Bins;