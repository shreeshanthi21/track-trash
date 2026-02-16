require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

// ========================
// IMPORT ROUTES (PHASE 1 + 2 + 3)
// ========================
const authRoutes = require("./routes/authRoutes");
const binRoutes = require("./routes/binRoutes");            // Phase 1
const sensorRoutes = require("./routes/sensorRoutes");      // Phase 1
const alertRoutes = require("./routes/alertRoutes");        // Phase 2
const collectionRoutes = require("./routes/collectionRoutes"); // Phase 2
const issueRoutes = require("./routes/issueRoutes");        // Phase 2
const notificationRoutes = require("./routes/notificationRoutes"); // Phase 2
const analyticsRoutes = require("./routes/analyticsRoutes"); // Phase 2

// ⭐ Phase 3 Routes
const predictionRoutes = require("./routes/predictionRoutes");
const routeRoutes = require("./routes/routeRoutes");

// ========================
// CREATE EXPRESS APP FIRST
// ========================
const app = express();

// ========================
// SOCKET.IO SETUP (PHASE 3)
// ========================
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" }
});

app.set("io", io);

// ========================
// MIDDLEWARE
// ========================
app.use(cors());
app.use(express.json());

// ========================
// ROUTE MOUNTING
// ========================

// 🔹 Phase 1
app.use("/api/auth", authRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/sensor", sensorRoutes);

// 🔹 Phase 2
app.use("/api/alerts", alertRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// 🔹 Phase 3
app.use("/api/predictions", predictionRoutes);
app.use("/api/routes", routeRoutes);

// ========================
// ROOT CHECK
// ========================
app.get("/", (req, res) => {
  res.send("Track Trash Backend is running");
});

// ========================
// START SERVER
// ========================
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
