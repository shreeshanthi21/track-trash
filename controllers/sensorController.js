const db = require("../config/db");

function normalizeFromDistance(distanceCm) {
  const MAX_HEIGHT = 25; // adjust to your bin height

  let fill = ((MAX_HEIGHT - distanceCm) / MAX_HEIGHT) * 100;

  if (fill < 0) fill = 0;
  if (fill > 100) fill = 100;

  fill = Math.round(fill);

  let sensorStatus = "EMPTY";
  let binStatus = "empty";

  if (fill >= 80) {
    sensorStatus = "FULL";
    binStatus = "full";
  } else if (fill > 0) {
    sensorStatus = "HALF";
    binStatus = "active";
  }

  return {
    fillLevel: fill,
    sensorStatus,
    binStatus,
  };
}
function normalizeFromFill(fillLevel) {
  if (fillLevel >= 80) {
    return { fillLevel, sensorStatus: "FULL", binStatus: "full" };
  }

  if (fillLevel > 0) {
    return { fillLevel, sensorStatus: "HALF", binStatus: "active" };
  }

  return { fillLevel: 0, sensorStatus: "EMPTY", binStatus: "empty" };
}
function persistSensorReading(payload, io) {
  return new Promise((resolve, reject) => {
    const { bin_id, fill_level, distance_cm, status } = payload;

    if (bin_id === undefined || (fill_level === undefined && distance_cm === undefined)) {
      reject(new Error("bin_id and either fill_level or distance_cm are required"));
      return;
    }

    const parsedDistance =
      distance_cm !== undefined && distance_cm !== null ? Number(distance_cm) : null;
    const parsedFill =
      fill_level !== undefined && fill_level !== null ? Number(fill_level) : null;

    let normalized;

    if (parsedDistance !== null && !Number.isNaN(parsedDistance)) {
      normalized = normalizeFromDistance(parsedDistance);
    } else if (parsedFill !== null && !Number.isNaN(parsedFill)) {
      normalized = normalizeFromFill(parsedFill);
    } else {
      reject(new Error("Invalid sensor payload"));
      return;
    }

    const fillLevel = normalized.fillLevel;
    const sensorStatus = status || normalized.sensorStatus;
    const newStatus = normalized.binStatus;

    db.query("SELECT status FROM bins WHERE id = ?", [bin_id], (errPrev, prevRows) => {
      if (errPrev) return reject(errPrev);
      if (prevRows.length === 0) return reject(Object.assign(new Error("Bin not found"), { statusCode: 404 }));

      const previousStatus = prevRows[0].status;

      db.query(
        "INSERT INTO sensor_data (bin_id, fill_level, distance_cm, sensor_status) VALUES (?, ?, ?, ?)",
        [bin_id, fillLevel, parsedDistance, sensorStatus],
        (errInsert) => {
          if (errInsert) return reject(errInsert);

          db.query(
            `UPDATE bins
             SET current_fill = ?, latest_distance_cm = ?, sensor_status = ?, status = ?
             WHERE id = ?`,
            [fillLevel, parsedDistance, sensorStatus, newStatus, bin_id],
            (errUpdate) => {
              if (errUpdate) return reject(errUpdate);

              if (previousStatus !== "full" && newStatus === "full") {
                db.query(
                  `INSERT INTO alerts (bin_id, alert_type, message, status)
                   VALUES (?, ?, ?, 'active')`,
                  [bin_id, "OVERFLOW", "Bin is full and needs collection"],
                  (errAlert) => {
                    if (errAlert) {
                      console.error("Alert insert error:", errAlert);
                    } else {
                      db.query("SELECT id FROM users WHERE role = 'admin'", (errAdmins, admins) => {
                        if (!errAdmins && admins.length > 0) {
                          admins.forEach((admin) => {
                            db.query(
                              `INSERT INTO notifications (user_id, title, message, type)
                               VALUES (?, ?, ?, ?)`,
                              [
                                admin.id,
                                "Bin Full Alert",
                                `Bin #${bin_id} is full and needs collection`,
                                "ALERT",
                              ]
                            );
                          });
                        }
                      });
                    }
                  }
                );
              }

              if (newStatus === "empty") {
                db.query(
                  `UPDATE alerts
                   SET status = 'resolved'
                   WHERE bin_id = ? AND alert_type = 'OVERFLOW'`,
                  [bin_id]
                );
              }

              const result = {
                message: "Sensor data updated successfully",
                bin_id: Number(bin_id),
                distance_cm: parsedDistance,
                fill_level: fillLevel,
                sensor_status: sensorStatus,
                status: newStatus,
              };

              if (io) {
                io.emit("sensorData", result);
              }

              resolve(result);
            }
          );
        }
      );
    });
  });
}

async function updateSensorData(req, res) {
  try {
    const result = await persistSensorReading(req.body, req.app.get("io"));
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message || "Failed to update sensor data",
    });
  }
}

module.exports = {
  updateSensorData,
  persistSensorReading,
};
