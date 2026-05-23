const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  // Add this block right here:
  ssl: {
    rejectUnauthorized: true
  }
});

db.connect((err) => {
  if (err) {
    console.error(
      `Database not connected: ${err.code || "UNKNOWN"} ${err.message}`
    );
  } else {
    console.log(
      `Database connected to ${process.env.DB_HOST || "localhost"}/${process.env.DB_NAME || "track_trash"}`
    );
  }
});

module.exports = db;
