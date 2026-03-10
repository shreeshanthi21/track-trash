import { useEffect, useState } from "react";
import api from "../services/api";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load notifications");
      setLoading(false);
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "bin_full":
        return "🔴";
      case "collection":
        return "🚚";
      case "alert":
        return "⚠️";
      case "maintenance":
        return "🔧";
      default:
        return "📢";
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="notifications-container"><p>Loading notifications...</p></div>;

  return (
    <div className="notifications-container">
      <div className="page-header">
        <h1>🔔 Notifications</h1>
        <p>Stay updated with system notifications and alerts</p>
      </div>

      <div className="notifications-toolbar">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
        {filteredNotifications.length > 0 && (
          <button className="btn-small btn-secondary">
            Mark all as read
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === "unread" ? "📭 No unread notifications" : "✨ All caught up!"}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.isRead ? "unread" : ""}`}
            >
              <div className="notification-content">
                <span className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="notification-text">
                  <h4>{notification.title || notification.message}</h4>
                  <p className="notification-desc">{notification.description || notification.body}</p>
                  <span className="notification-time">
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString()
                      : "Unknown time"}
                  </span>
                </div>
                {!notification.isRead && <span className="unread-dot"></span>}
              </div>

              <div className="notification-actions">
                {!notification.isRead && (
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
                  title="Delete"
                >
                  ✕
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
