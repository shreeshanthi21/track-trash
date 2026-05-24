import { useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Navbar.css";

function Navbar() {
  const { logout, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(() => {
    const role = user?.role || "user";
    
    // 1️⃣ Baseline array setup
    let items = [
      { to: "/", label: "Dashboard" },
      { to: "/bins", label: "Bins" },
      { to: "/map", label: "Map" },
      { to: "/alerts", label: "Alerts" },
      { to: "/issues", label: "Issues" },
      { to: "/notifications", label: "Notifications" },
    ];

    // 🛠️ FIX: Filter out Alerts and Issues specifically for collectors
    if (role === "collector") {
      items = items.filter(item => item.to !== "/alerts" && item.to !== "/issues");
    }

    // 2️⃣ Splice in collections dynamically
    if (role === "admin" || role === "collector") {
      // Adjusted the slice index location because collectors have fewer items now
      const insertIndex = role === "collector" ? 3 : 4;
      items.splice(insertIndex, 0, { to: "/collections", label: "Collections" });
    }

    items.push({ to: "/classify", label: "Classify" });

    if (role === "admin") {
      items.push({ to: "/admin", label: "Admin", admin: true });
    }

    return items;
  }, [user?.role]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-badge">TT</span>
          <span className="navbar-logo-text">
            <strong>Track Trash</strong>
            <small>Smart waste operations</small>
          </span>
        </Link>

        <button
          className="navbar-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-panel ${menuOpen ? "is-open" : ""}`}>
          <nav className="nav-menu" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `nav-link ${item.admin ? "nav-link-admin" : ""} ${isActive ? "is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-user">
            <LanguageSwitcher />

            <div className="user-chip">
              <span className="user-avatar" aria-hidden="true">
                👤
              </span>
              <span className="user-chip-label">{user?.role || "user"}</span>
            </div>

            <button className="btn-logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;