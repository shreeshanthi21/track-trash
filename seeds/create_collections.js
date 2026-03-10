const db = require("../config/db");

// This script assigns a bin to a collector for testing
// Usage: node seeds/create_collections.js

console.log("Creating test collection assignment...");

// Assign bins to collector (assuming collector_id = 2, bin_id = 1)
const collectorId = 2;  // Change this to your collector user ID
const binId = 1;        // Change this to an existing bin ID

db.query(
  `INSERT INTO collections (bin_id, collector_id, status)
   VALUES (?, ?, 'pending')`,
  [binId, collectorId],
  (err, result) => {
    if (err) {
      console.error("❌ Error:", err.message);
      process.exit(1);
    }
    console.log(`✅ Collection created! Assigned Bin #${binId} to Collector #${collectorId}`);
    process.exit(0);
  }
);
