const db = require("../config/db");

// Migration to add issue_type column to issues table
db.query(
  `ALTER TABLE issues ADD COLUMN issue_type VARCHAR(50) AFTER bin_id`,
  (err) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("✅ Column 'issue_type' already exists");
      } else {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
      }
    } else {
      console.log("✅ Successfully added 'issue_type' column to issues table");
    }
    process.exit(0);
  }
);
