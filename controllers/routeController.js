const db = require("../config/db");
exports.optimizeRoute = (req, res) => {
  db.query(
    "SELECT id, location FROM bins WHERE status='full'",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json({ route: rows });
    }
  );
};
