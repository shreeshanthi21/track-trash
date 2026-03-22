import { useEffect, useState } from "react";
import api from "../services/api";
import TX from "../components/TranslatedText";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data || []);
      setError("");
    } catch (err) {
      console.error("Failed to load notifications", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "collection": return "🚚";
      case "alert":      return "⚠️";
      case "issue":      return "🛠️";
      default:           return "📢";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read")   return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllVisibleAsRead = async () => {
    await Promise.all(
      filteredNotifications
        .filter((n) => !n.is_read)
        .map((n) => markAsRead(n.id))
    );
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <p><TX>Loading notifications...</TX></p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="page-header">
        <h1><TX>Notifications</TX></h1>
        <p><TX>Review assignments, alerts, and system updates in one place.</TX></p>
      </div>

      <div className="notifications-toolbar">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <TX>All</TX> ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            <TX>Unread</TX> ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            <TX>Read</TX> ({notifications.length - unreadCount})
          </button>
        </div>

        {filteredNotifications.some((n) => !n.is_read) && (
          <button className="btn-small btn-secondary" onClick={markAllVisibleAsRead}>
            <TX>Mark visible as read</TX>
          </button>
        )}
      </div>

      {error && <p className="error"><TX>{error}</TX></p>}

      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === "unread"
              ? <TX>No unread notifications.</TX>
              : <TX>All caught up.</TX>}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.is_read ? "unread" : ""}`}
            >
              <div className="notification-content">
                <span className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="notification-text">
                  <h4><TX>{notification.title || "Notification"}</TX></h4>
                  <p className="notification-desc">
                    <TX>{notification.message}</TX>
                  </p>
                  <span className="notification-time">
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString()
                      : "Unknown time"}
                  </span>
                </div>
                {!notification.is_read && <span className="unread-dot" />}
              </div>

              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="action-btn read-btn"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={() => deleteNotification(notification.id)}
                  title="Delete notification"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;