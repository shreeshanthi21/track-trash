const db = require("../config/db");

exports.getPredictions = (req, res) => {
  db.query(
    `
    SELECT bin_id,
    AVG(fill_level) AS avg_fill
    FROM sensor_data
    GROUP BY bin_id
    `,
    (err, rows) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.json(rows);
    }
  );
};
