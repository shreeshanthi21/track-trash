const db = require("../config/db");
const { createNotification } = require("../utils/notificationService");

// =====================================
// Assign bin to collector (ADMIN)
// =====================================
exports.assignBin = (req, res) => {
  const { bin_id, collector_id } = req.body;

  if (!bin_id || !collector_id) {
    return res.status(400).json({ message: "bin_id and collector_id required" });
  }

  // 1️⃣ Check if bin exists
  db.query("SELECT id FROM bins WHERE id = ?", [bin_id], (errBin, binRows) => {
    if (errBin) return res.status(500).json({ error: errBin.message });
    if (binRows.length === 0) return res.status(404).json({ message: "Bin not found" });

    // 2️⃣ Validate collector
    db.query("SELECT id FROM users WHERE id = ? AND role = 'collector'", [collector_id], (errUser, users) => {
      if (errUser) return res.status(500).json({ error: errUser.message });
      if (users.length === 0) {
        return res.status(400).json({ message: "Invalid collector. User is not a collector." });
      }

      // 3️⃣ Prevent duplicate pending assignment
      db.query(
        "SELECT id FROM collections WHERE bin_id = ? AND status = 'pending'",
        [bin_id],
        (errCheck, existing) => {
          if (errCheck) return res.status(500).json({ error: errCheck.message });
          if (existing.length > 0) {
            return res.status(400).json({ message: "This bin is already assigned and pending." });
          }

          // 4️⃣ Insert assignment
          db.query(
            "INSERT INTO collections (bin_id, collector_id, status) VALUES (?, ?, 'pending')",
            [bin_id, collector_id],
            (errInsert) => {
              if (errInsert) return res.status(500).json({ error: errInsert.message });

              // 🔔 Notify collector safely
              try {
                createNotification(
                  collector_id,
                  "New Collection Assigned",
                  `You have been assigned Bin #${bin_id}`,
                  "COLLECTION"
                );
              } catch (notifErr) {
                console.error("Notification loop bypassed:", notifErr);
              }

              return res.json({ message: "Bin assigned to collector successfully" });
            }
          );
        }
      );
    });
  });
};

// =====================================
// View all collections (ADMIN)
// =====================================
exports.getAllCollections = (req, res) => {
  db.query("SELECT * FROM collections ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(results || []);
  });
};

// =====================================
// View my collections (COLLECTOR)
// =====================================
exports.getMyCollections = (req, res) => {
  const collectorId = req.user?.id;
  if (!collectorId) return res.status(401).json({ message: "Unauthorized token state" });

  db.query(
    `SELECT 
      c.id AS id,
      c.bin_id AS bin_id,
      c.collector_id AS collector_id,
      c.status AS status,
      b.location AS location,
      b.capacity AS capacity,
      b.current_fill AS current_fill,
      b.status AS bin_status
     FROM collections c
     INNER JOIN bins b ON c.bin_id = b.id
     WHERE c.collector_id = ? AND c.status = 'pending'
     ORDER BY c.id DESC`,
    [collectorId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Failed to fetch collections", error: err.message });
      return res.json(results || []);
    }
  );
};

// =====================================
// Complete collection (COLLECTOR)
// =====================================
exports.completeCollection = (req, res) => {
  const { id } = req.params;

  // 1️⃣ Get bin_id
  db.query("SELECT bin_id FROM collections WHERE id = ?", [id], (errFetch, rows) => {
    if (errFetch) return res.status(500).json({ error: errFetch.message });
    if (rows.length === 0) return res.status(404).json({ message: "Collection not found" });

    const bin_id = rows[0].bin_id;

    // 2️⃣ Mark collection as collected
    db.query(
      "UPDATE collections SET status='completed', collected_at=NOW() WHERE id=?",
      [id],
      (errUpdate) => {
        if (errUpdate) return res.status(500).json({ error: errUpdate.message });

        // 3️⃣ Reset bin
        db.query(
          "UPDATE bins SET current_fill=0, status='empty' WHERE id=?",
          [bin_id],
          (errReset) => {
            if (errReset) return res.status(500).json({ error: errReset.message });

            // 4️⃣ Auto-resolve overflow alerts completely before returning response
            db.query(
              "UPDATE alerts SET status='resolved' WHERE bin_id=? AND alert_type='OVERFLOW'",
              [bin_id],
              (errAlert) => {
                if (errAlert) console.error("Alert mitigation bypass:", errAlert);
                return res.json({ message: "Collection completed and bin reset" });
              }
            );
          }
        );
      }
    );
  });
};

// =====================================
// Update collection (ADMIN)
// =====================================
exports.updateCollection = (req, res) => {
  const { id } = req.params;
  const { status, bin_id, collector_id } = req.body;

  if (!status && !bin_id && !collector_id) {
    return res.status(400).json({ message: "At least one field is required" });
  }

  let updateFields = [];
  let updateValues = [];

  if (status) { updateFields.push("status = ?"); updateValues.push(status); }
  if (bin_id) { updateFields.push("bin_id = ?"); updateValues.push(bin_id); }
  if (collector_id) { updateFields.push("collector_id = ?"); updateValues.push(collector_id); }

  updateValues.push(id);

  db.query(
    `UPDATE collections SET ${updateFields.join(", ")} WHERE id = ?`,
    updateValues,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Collection not found" });

      return res.json({
        message: "Collection updated successfully",
        collection: { id, status, bin_id, collector_id }
      });
    }
  );
};