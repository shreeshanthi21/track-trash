import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TX from "../components/TranslatedText";
import "./Login.css";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      setSuccess("Account created. Signing you in...");

      try {
        await login(formData.email, formData.password);
        navigate("/");
      } catch (loginError) {
        setSuccess("Account created. Please sign in with your new credentials.");
        setTimeout(() => navigate("/login"), 1200);
        console.error("Auto-login failed after registration", loginError);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-register">
      <div className="auth-layout auth-layout-register">
        <section className="auth-panel auth-panel-brand">
          <span className="auth-kicker"><TX>Create your workspace</TX></span>
          <h1><TX>Set up your account and get into the platform.</TX></h1>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-form-shell">
            <span className="auth-eyebrow"><TX>Join Track Trash</TX></span>
            <h2><TX>Create your account</TX></h2>
            <p><TX>Choose your role, fill in your details, and continue to login.</TX></p>

            <form onSubmit={handleSubmit} className="auth-form auth-form-register">
              <div className="form-group">
                <label htmlFor="name"><TX>Full name</TX></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email"><TX>Email address</TX></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password"><TX>Password</TX></label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword"><TX>Confirm password</TX></label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role"><TX>Role</TX></label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="user"><TX>User</TX></option>
                  <option value="collector"><TX>Collector</TX></option>
                  <option value="admin"><TX>Admin</TX></option>
                </select>
              </div>

              {error   && <div className="error-message"><TX>{error}</TX></div>}
              {success && <div className="success-message"><TX>{success}</TX></div>}

              <button type="submit" className="btn-register" disabled={loading}>
                {loading ? <TX>Creating account...</TX> : <TX>Create account</TX>}
              </button>
            </form>

            <div className="auth-footer">
              <span><TX>Already have an account?</TX></span>
              <Link to="/login"><TX>Sign in</TX></Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Register;