import { useEffect, useState } from "react";
import api from "../services/api";
import "./Issues.css";

function Issues() {
  const [issues, setIssues] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    issue_type: "",
    description: "",
    bin_id: ""
  });

  useEffect(() => {
    fetchIssues();
    fetchBins();
    const role = localStorage.getItem("userRole") || "user";
    setUserRole(role);
  }, []);

  const fetchIssues = async () => {
    try {
      const role = localStorage.getItem("userRole") || "user";
      let res;

      if (role === "admin") {
        res = await api.get("/issues");
      } else {
        res = await api.get("/issues/my");
      }

      setIssues(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load issues");
      setLoading(false);
      console.error(err);
    }
  };

  const fetchBins = async () => {
    try {
      const res = await api.get("/bins");
      setBins(res.data || []);
    } catch (err) {
      console.error("Failed to load bins", err);
      setBins([]);
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.bin_id) {
      setError("Bin ID is required");
      return;
    }

    try {
      const payload = {
        bin_id: parseInt(formData.bin_id),
        issue_type: formData.issue_type,
        description: formData.description
      };
      
      await api.post("/issues", payload);
      setFormData({ issue_type: "", description: "", bin_id: "" });
      setShowForm(false);
      fetchIssues();
    } catch (err) {
      console.error("Failed to create issue", err);
      setError(err.response?.data?.message || "Failed to create issue");
    }
  };

  const resolveIssue = async (id) => {
    try {
      await api.put(`/issues/resolve/${id}`);
      setIssues(issues.map(i => 
        i.id === id ? { ...i, status: "resolved" } : i
      ));
    } catch (err) {
      console.error("Failed to resolve issue", err);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "🔴";
      case "medium":
        return "🟠";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  if (loading) return <div className="issues-container"><p>Loading issues...</p></div>;

  return (
    <div className="issues-container">
      <div className="page-header">
        <h1>🐛 Issues & Reports</h1>
        <p>Report and track waste management issues</p>
      </div>

      {userRole !== "admin" && (
        <div className="create-issue-section">
          {!showForm ? (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Report New Issue
            </button>
          ) : (
            <form className="issue-form" onSubmit={handleSubmitIssue}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Issue Type</label>
                <select
                  value={formData.issue_type}
                  onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
                  required
                >
                  <option value="">Select issue type</option>
                  <option value="mechanical">Mechanical Problem</option>
                  <option value="overflow">Overflow</option>
                  <option value="damage">Damage</option>
                  <option value="malfunction">Malfunction</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group">
                <label>Bin ID *</label>
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
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Submit Issue</button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {issues.length === 0 ? (
        <div className="empty-state">
          <p>✨ No issues reported. Great job!</p>
        </div>
      ) : (
        <div className="issues-list">
          {issues.map((issue) => (
            <div key={issue.id} className={`issue-card ${issue.priority?.toLowerCase() || 'medium'}`}>
              <div className="issue-header">
                <span className="priority-icon">{getPriorityIcon(issue.priority)}</span>
                <div className="issue-title-section">
                  <h3>{issue.title}</h3>
                  <p className="issue-meta">
                    {issue.reporterName && <>by {issue.reporterName} •</> } 
                    {issue.createdAt && new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`status-badge ${issue.status?.toLowerCase() || 'open'}`}>
                  {issue.status || "Open"}
                </span>
              </div>

              <div className="issue-body">
                <p>{issue.description}</p>
                {issue.binId && (
                  <p className="issue-bin">
                    <strong>Affected Bin:</strong> {issue.binId}
                  </p>
                )}
              </div>

              <div className="issue-footer">
                {userRole === "admin" && issue.status?.toLowerCase() !== "resolved" && (
                  <button
                    className="btn-small btn-primary"
                    onClick={() => resolveIssue(issue.id)}
                  >
                    Resolve Issue
                  </button>
                )}
                {issue.status?.toLowerCase() === "resolved" && (
                  <span className="resolved-badge">✅ Resolved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Issues;
