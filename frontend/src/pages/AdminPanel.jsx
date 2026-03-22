import { useEffect, useState } from "react";
import api from "../services/api";
import TX from "../components/TranslatedText";
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
      const collectorsRes = await api.get("/users/collectors");
      setCollectors(collectorsRes.data || []);

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

      setSuccess("Collection assigned successfully!");
      setFormData({ collector_id: "", bin_id: "" });

      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign collection");
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <p><TX>Loading...</TX></p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="page-header">
        <h1>⚙️ <TX>Admin Panel</TX></h1>
        <p><TX>Manage system operations</TX></p>
      </div>

      <div className="admin-section">
        <h2>📋 <TX>Assign Collection to Collector</TX></h2>

        {error   && <div className="error-message"><TX>{error}</TX></div>}
        {success && <div className="success-message"><TX>{success}</TX></div>}

        <form onSubmit={handleAssignCollection} className="assign-form">

          <div className="form-group">
            <label><TX>Collector</TX> *</label>
            <select
              value={formData.collector_id}
              onChange={(e) => setFormData({ ...formData, collector_id: e.target.value })}
              required
            >
              <option value=""><TX>Select a collector</TX></option>
              {collectors.length > 0 ? (
                collectors.map((collector) => (
                  <option key={collector.id} value={collector.id}>
                    {collector.name} (ID: {collector.id})
                  </option>
                ))
              ) : (
                <option disabled><TX>No collectors available</TX></option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label><TX>Bin</TX> *</label>
            <select
              value={formData.bin_id}
              onChange={(e) => setFormData({ ...formData, bin_id: e.target.value })}
              required
            >
              <option value=""><TX>Select a bin</TX></option>
              {bins.length > 0 ? (
                bins.map((bin) => (
                  <option key={bin.id} value={bin.id}>
                    Bin #{bin.id} - {bin.location || "No location"}
                  </option>
                ))
              ) : (
                <option disabled><TX>No bins available</TX></option>
              )}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            <TX>Assign Collection</TX>
          </button>

        </form>
      </div>

      <div className="info-section">
        <p>📌 <TX>Available Collectors</TX>: {collectors.length}</p>
        <p>📦 <TX>Available Bins</TX>: {bins.length}</p>
      </div>
    </div>
  );
}

export default AdminPanel;