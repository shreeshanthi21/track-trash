import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TX from "../components/TranslatedText";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-panel auth-panel-brand">
          <span className="auth-kicker">Track Trash</span>
          <h1><TX>TrackTrash: Smarter tracking for cleaner cities.</TX></h1>
          <p><TX>Monitor bins, route collectors, and handle reports.</TX></p>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-form-shell">
            <span className="auth-eyebrow"><TX>Welcome back</TX></span>
            <h2><TX>Sign in to your workspace</TX></h2>
            <p><TX>Use your registered email and password to continue.</TX></p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email"><TX>Email address</TX></label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password"><TX>Password</TX></label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="error-message"><TX>{error}</TX></div>
              )}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <TX>Signing in...</TX> : <TX>Sign in</TX>}
              </button>
            </form>

            <div className="auth-footer">
              <span><TX>New here?</TX></span>
              <Link to="/register"><TX>Create an account</TX></Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;