const db = require("../config/db");

// =====================================
// Add a New Smart Bin (ADMIN)
// =====================================
exports.addBin = (req, res) => {
  const { location, capacity } = req.body;

  if (!location || !capacity) {
    return res.status(400).json({ message: "Location and capacity required" });
  }

  db.query(
    "INSERT INTO bins (location, capacity, status) VALUES (?, ?, 'empty')",
    [location, capacity],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.status(201).json({
        message: "Bin added successfully",
        binId: result.insertId
      });
    }
  );
};

// =====================================
// Fetch All Bins (ADMIN / COLLECTOR / USER)
// =====================================
exports.getAllBins = (req, res) => {
  db.query("SELECT * FROM bins", (err, result) => {
    if (err) return res.status(500).json({ message: "Something went wrong", error: err.message });
    return res.status(200).json(result || []);
  });
};

// =====================================
// Update Bin Fill Level (HARDWARE / MANUAL)
// =====================================
exports.updateBinFill = (req, res) => {
  const { id } = req.params;
  const { current_fill } = req.body;

  let status = "active";
  if (current_fill >= 80) status = "full";
  else if (current_fill === 0) status = "empty";

  db.query(
    "UPDATE bins SET current_fill=?, status=? WHERE id=?",
    [current_fill, status, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.status(200).json({ message: "Bin updated successfully" });
    }
  );
};