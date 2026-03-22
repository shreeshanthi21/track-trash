import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LangProvider } from "./i18n/LangContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Bins from "./pages/Bins";
import Alerts from "./pages/Alerts";
import Collections from "./pages/Collections";
import Issues from "./pages/Issues";
import Notifications from "./pages/Notifications";
import AdminPanel from "./pages/AdminPanel";
import MapPage from "./pages/Map";
import "./App.css";

function App() {
  return (
    <LangProvider>
      <Router>
        <AuthProvider>
          <div className="app-shell">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <Dashboard />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bins"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <Bins />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <MapPage />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <Alerts />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/collections"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <Collections />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <Issues />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <Notifications />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <main className="app-main">
                      <AdminPanel />
                    </main>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </LangProvider>
  );
}

export default App;