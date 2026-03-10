const db = require("../config/db");
const { createNotification } = require("../utils/notificationService");


// ===============================
// 1️⃣ Report Issue (USER)
// POST /api/issues
// ===============================
exports.createIssue = (req, res) => {
  const { bin_id, issue_type, description } = req.body;
  const user_id = req.user.id;

  if (!bin_id || !issue_type || !description || description.trim() === "") {
    return res.status(400).json({
      message: "bin_id, issue_type and description are required"
    });
  }

  // Check if bin exists
  db.query(
    "SELECT id FROM bins WHERE id = ?",
    [bin_id],
    (err, bins) => {
      if (err) {
        console.error("Error checking bin:", err);
        return res.status(500).json({ message: "Database error checking bin" });
      }

      if (bins.length === 0) {
        return res.status(404).json({
          message: "Bin not found"
        });
      }

      // Insert issue
      db.query(
        `INSERT INTO issues 
         (user_id, bin_id, issue_type, description, status, created_at)
         VALUES (?, ?, ?, ?, 'open', NOW())`,
        [user_id, bin_id, issue_type, description],
        (err2, result) => {
          if (err2) {
            console.error("Error creating issue:", err2);
            return res.status(500).json({ message: "Database error creating issue" });
          }

          res.status(201).json({
            message: "Issue reported successfully",
            issue_id: result.insertId
          });
        }
      );
    }
  );
};


// ===============================
// 2️⃣ View My Issues (USER)
// GET /api/issues/my
// ===============================
exports.getMyIssues = (req, res) => {
  const user_id = req.user.id;

  db.query(
    `SELECT * FROM issues 
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};


// ===============================
// 3️⃣ View All Issues (ADMIN)
// GET /api/issues
// ===============================
exports.getAllIssues = (req, res) => {
  db.query(
    `SELECT 
        issues.*,
        users.name AS reporter_name,
        bins.location AS bin_location
     FROM issues
     JOIN users ON issues.user_id = users.id
     JOIN bins ON issues.bin_id = bins.id
     ORDER BY issues.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};


// ===============================
// 4️⃣ Resolve Issue (ADMIN)
// PUT /api/issues/resolve/:id
// ===============================
exports.resolveIssue = (req, res) => {
  const { id } = req.params;

  // Get issue first
  db.query(
    "SELECT user_id, status FROM issues WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Issue not found"
        });
      }

      const issue = rows[0];

      // Prevent resolving twice
      if (issue.status === "resolved") {
        return res.status(400).json({
          message: "Issue already resolved"
        });
      }

      // Update issue
      db.query(
        `UPDATE issues 
         SET status = 'resolved', resolved_at = NOW()
         WHERE id = ?`,
        [id],
        (err2) => {
          if (err2) return res.status(500).json(err2);

          // 🔔 Notify the reporting user
          createNotification(
            issue.user_id,
            "Issue Resolved",
            "Your reported issue has been resolved.",
            "ISSUE"
          );

          res.json({
            message: "Issue resolved successfully"
          });
        }
      );
    }
  );
};
