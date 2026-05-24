const db = require("../config/db");
// 🔔 Import your notification utility function
const { createNotification } = require("../utils/notificationService");

// =====================================
// USER: create map issue
// =====================================
const createMapIssue = (req, res) => {
  const { description, latitude, longitude } = req.body;
  const user_id = req.user.id;

  if (!description || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "Description, latitude and longitude are required" });
  }

  const sql = `
    INSERT INTO map_issues (user_id, description, latitude, longitude)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [user_id, description, latitude, longitude], (err, result) => {
    if (err) {
      console.error("Error creating map issue:", err);
      return res.status(500).json({ message: "Server error while creating map issue" });
    }

    // Optional: Notify system admins that a new public issue has been raised
    try {
      createNotification(1, "New Map Issue Reported", `A new cleanup request ("${description}") has been pinned on the map.`, "ISSUE");
    } catch (e) {
      console.error("Admin notification skipped:", e);
    }

    return res.status(201).json({
      message: "Map issue created successfully",
      issueId: result.insertId,
    });
  });
};

// =====================================
// USER: get my map issues
// =====================================
const getMyMapIssues = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT *
    FROM map_issues
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching user map issues:", err);
      return res.status(500).json({ message: "Server error while fetching map issues" });
    }
    return res.json(results || []);
  });
};

// =====================================
// ADMIN: get all map issues
// =====================================
const getAllMapIssues = (req, res) => {
  const sql = `
    SELECT *
    FROM map_issues
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all map issues:", err);
      return res.status(500).json({ message: "Server error while fetching all map issues" });
    }
    return res.json(results || []);
  });
};

// =====================================
// ADMIN: assign collector
// =====================================
const assignCollectorToMapIssue = (req, res) => {
  const { id } = req.params;
  const { assigned_collector_id } = req.body;

  if (!assigned_collector_id) {
    return res.status(400).json({ message: "assigned_collector_id is required" });
  }

  // 1️⃣ First get the description/location details to mirror them cleanly
  db.query("SELECT description FROM map_issues WHERE id = ?", [id], (errFetch, rows) => {
    if (errFetch || rows.length === 0) {
      return res.status(404).json({ message: "Map issue not found" });
    }

    const issueDescription = rows[0].description || "Map Issue Cleanup";

    // 2️⃣ Update the map_issues assignment status
    const updateMapSql = `
      UPDATE map_issues
      SET assigned_collector_id = ?, status = 'assigned'
      WHERE id = ?
    `;

    db.query(updateMapSql, [assigned_collector_id, id], (errMap) => {
      if (errMap) {
        console.error("Error assigning collector:", errMap);
        return res.status(500).json({ message: "Server error while assigning collector" });
      }

      // 3️⃣ 🛠️ SYNC DASHBOARD: Create a tracking row inside the collections table so it registers on the UI panels
      const syncCollectionSql = `
        INSERT INTO collections (bin_id, collector_id, status, location)
        VALUES (NULL, ?, 'pending', ?)
      `;
      
      const uniqueDashboardLocationName = `Map Issue #${id}: ${issueDescription}`;

      db.query(syncCollectionSql, [assigned_collector_id, uniqueDashboardLocationName], (errSync) => {
        if (errSync) console.error("⚠️ Failed to mirror row inside collections schema:", errSync);

        // 4️⃣ 🔔 NOTIFY COLLECTOR: Send an alert to their internal inbox app panel
        try {
          createNotification(
            assigned_collector_id,
            "New Map Job Assigned 🚚",
            `You have been assigned to clear: ${issueDescription}`,
            "COLLECTION"
          );
        } catch (notifErr) {
          console.error("Notification pipeline skipped:", notifErr);
        }

        return res.json({ message: "Collector assigned and collection dashboard synchronized successfully" });
      });
    });
  });
};

// =====================================
// COLLECTOR: get assigned map issues
// =====================================
const getCollectorMapIssues = (req, res) => {
  const collector_id = req.user.id;

  const sql = `
    SELECT *
    FROM map_issues
    WHERE assigned_collector_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [collector_id], (err, results) => {
    if (err) {
      console.error("Error fetching collector map issues:", err);
      return res.status(500).json({ message: "Server error while fetching assigned map issues" });
    }
    return res.json(results || []);
  });
};

// =====================================
// COLLECTOR: update status & notify
// =====================================
const updateMapIssueStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g., 'done'
  const collector_id = req.user.id;

  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  // 1️⃣ Fetch tracking items to know who reported this issue and get its string reference description
  db.query("SELECT user_id, description FROM map_issues WHERE id = ?", [id], (errFetch, rows) => {
    if (errFetch || rows.length === 0) {
      return res.status(404).json({ message: "Map issue context not found" });
    }

    const reporterUserId = rows[0].user_id;
    const issueDescription = rows[0].description || "";

    // 2️⃣ Update the map_issues record row
    const updateMapSql = `
      UPDATE map_issues
      SET status = ?
      WHERE id = ? AND assigned_collector_id = ?
    `;

    db.query(updateMapSql, [status, id, collector_id], (errUpdate, result) => {
      if (errUpdate) {
        console.error("Error updating map issue status:", errUpdate);
        return res.status(500).json({ message: "Server error while updating status" });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({ message: "Unauthorized or issue mapping mismatch" });
      }

      // 3️⃣ 🛠️ SYNC DASHBOARD: Update the status mirror in the collections table if marked complete
      if (status.toLowerCase() === "done") {
        const uniqueDashboardLocationName = `Map Issue #${id}: ${issueDescription}`;
        const updateCollectionSql = `
          UPDATE collections 
          SET status = 'completed', collected_at = NOW() 
          WHERE location = ? AND collector_id = ?
        `;
        
        db.query(updateCollectionSql, [uniqueDashboardLocationName, collector_id], (errCollUpdate) => {
          if (errCollUpdate) console.error("⚠️ Collection row completion sync error:", errCollUpdate);
        });

        // 4️⃣ 🔔 DISTRIBUTE NOTIFICATIONS: Tell the reporter and system administrator
        try {
          // Send notification to the User who originally reported it
          if (reporterUserId) {
            createNotification(
              reporterUserId,
              "Issue Resolved! ✅",
              `The cleanup request you reported ("${issueDescription}") has been cleared by our team. Thank you!`,
              "ISSUE"
            );
          }

          // Send notification to Admin (Targeting standard admin user index #1 or system pool)
          createNotification(
            1, 
            "Collection Task Completed",
            `A collector has successfully resolved and cleared Map Issue #${id}.`,
            "COLLECTION"
          );
        } catch (notifErr) {
          console.error("Real-time notifications skipped:", notifErr);
        }
      }

      return res.json({ message: "Map issue status updated and notifications sent cleanly" });
    });
  });
};

module.exports = {
  createMapIssue,
  getMyMapIssues,
  getAllMapIssues,
  assignCollectorToMapIssue,
  getCollectorMapIssues,
  updateMapIssueStatus,
};