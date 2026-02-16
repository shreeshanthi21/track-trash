const db = require("../config/db");

exports.updateSensorData = (req, res) => {
  const { bin_id, fill_level } = req.body;

  if (bin_id === undefined || fill_level === undefined) {
    return res.status(400).json({
      message: "bin_id and fill_level required"
    });
  }

  // Decide new status
  let newStatus = "active";
  if (fill_level >= 80) newStatus = "full";
  else if (fill_level === 0) newStatus = "empty";

  // 1️⃣ Get previous status first (prevents spam)
  db.query(
    "SELECT status FROM bins WHERE id = ?",
    [bin_id],
    (errPrev, prevRows) => {
      if (errPrev) return res.status(500).json(errPrev);

      if (prevRows.length === 0) {
        return res.status(404).json({ message: "Bin not found" });
      }

      const previousStatus = prevRows[0].status;

      // 2️⃣ Insert sensor data
      db.query(
        "INSERT INTO sensor_data (bin_id, fill_level) VALUES (?, ?)",
        [bin_id, fill_level],
        (err1) => {
          if (err1) {
            console.error("Sensor insert error:", err1);
            return res.status(500).json({ error: err1.message });
          }

          // 3️⃣ Update bin
          db.query(
            "UPDATE bins SET current_fill = ?, status = ? WHERE id = ?",
            [fill_level, newStatus, bin_id],
            (err2) => {
              if (err2) {
                console.error("Bin update error:", err2);
                return res.status(500).json({ error: err2.message });
              }
              // 4️⃣ Create alert + notification ONLY if status changed to full
              if (previousStatus !== "full" && newStatus === "full") {

                db.query(
                  `INSERT INTO alerts (bin_id, alert_type, message, status)
                   VALUES (?, ?, ?, 'active')`,
                  [bin_id, "OVERFLOW", "Bin is full and needs collection"],
                  (err3) => {
                    if (err3) {
                      console.error("Alert insert error:", err3);
                    } else {

                      // 🔔 Notify ALL admins
                      db.query(
                        "SELECT id FROM users WHERE role = 'admin'",
                        (errAdmins, admins) => {
                          if (!errAdmins && admins.length > 0) {
                            admins.forEach(admin => {
                              db.query(
                                `INSERT INTO notifications (user_id, title, message, type)
                                 VALUES (?, ?, ?, ?)`,
                                [
                                  admin.id,
                                  "Bin Full Alert",
                                  `Bin #${bin_id} is full and needs collection`,
                                  "ALERT"
                                ]
                              );
                            });
                          }
                        }
                      );
                    }
                  }
                );
              }
              //5️⃣ Auto-assign to collector if status changed to full
              // Phase 4 TODO: integrate real autoAssign(bin_id)
              if (previousStatus !== "full" && newStatus === "full") {
                console.log(" Auto-assign collector triggered for bin:", bin_id);
  
              }

              // 6 Auto-resolve alert if emptied
              if (newStatus === "empty") {
                db.query(
                  `UPDATE alerts 
                   SET status = 'resolved'
                   WHERE bin_id = ? AND alert_type = 'OVERFLOW'`,
                  [bin_id]
                );
              }
              req.app.get("io").emit("live",{ bin_id, status:newStatus });

              res.status(200).json({
                message: "Sensor data updated successfully",
                bin_id,
                fill_level,
                status: newStatus
              });
            }
          );
        }
      );
    }
  );
};
