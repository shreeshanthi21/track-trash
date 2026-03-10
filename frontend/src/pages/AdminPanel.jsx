import { useEffect, useState } from "react";
import api from "../services/api";
import "./AdminPanel.css";

function AdminPanel() {
  const [collectors, setCollectors] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    collector_id: "",
    bin_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch collectors
      const collectorsRes = await api.get("/users/collectors");
      setCollectors(collectorsRes.data || []);
      
      // Fetch bins
      const binsRes = await api.get("/bins");
      setBins(binsRes.data || []);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load collectors and bins");
      setLoading(false);
    }
  };

  const handleAssignCollection = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.collector_id || !formData.bin_id) {
      setError("Please select both a collector and a bin");
      return;
    }

    try {
      await api.post("/collections/assign", {
        collector_id: parseInt(formData.collector_id),
        bin_id: parseInt(formData.bin_id)
      });

      setSuccess("✅ Collection assigned successfully!");
      setFormData({ collector_id: "", bin_id: "" });
      
      // Reload after 2 seconds
      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign collection");
    }
  };

  if (loading) {
    return <div className="admin-panel"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-panel">
      <div className="page-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage system operations</p>
      </div>

      <div className="admin-section">
        <h2>📋 Assign Collection to Collector</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleAssignCollection} className="assign-form">
          <div className="form-group">
            <label>Collector *</label>
            <select
              value={formData.collector_id}
              onChange={(e) => setFormData({ ...formData, collector_id: e.target.value })}
              required
            >
              <option value="">Select a collector</option>
              {collectors.length > 0 ? (
                collectors.map((collector) => (
                  <option key={collector.id} value={collector.id}>
                    {collector.name} (ID: {collector.id})
                  </option>
                ))
              ) : (
                <option disabled>No collectors available</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Bin *</label>
            <select
              value={formData.bin_id}
              onChange={(e) => setFormData({ ...formData, bin_id: e.target.value })}
              required
            >
              <option value="">Select a bin</option>
              {bins.length > 0 ? (
                bins.map((bin) => (
                  <option key={bin.id} value={bin.id}>
                    Bin #{bin.id} - {bin.location || "No location"}
                  </option>
                ))
              ) : (
                <option disabled>No bins available</option>
              )}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Assign Collection
          </button>
        </form>
      </div>

      <div className="info-section">
        <p>📌 Available Collectors: {collectors.length}</p>
        <p>📦 Available Bins: {bins.length}</p>
      </div>
    </div>
  );
}

export default AdminPanel;
