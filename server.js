require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const authRoutes = require("./routes/authRoutes");
const binRoutes = require("./routes/binRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const alertRoutes = require("./routes/alertRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const issueRoutes = require("./routes/issueRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");
const mapIssueRoutes = require("./routes/mapIssueRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const routeRoutes = require("./routes/routeRoutes");
const translateRoutes = require("./routes/translateRoutes");
const { persistSensorReading } = require("./controllers/sensorController");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);

function initSerialBridge() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping serial in CI");
    return;
  }

  const serialPath = process.env.SERIAL_PORT;
  const serialBinId = Number(process.env.SERIAL_BIN_ID || 1);

  if (!serialPath) {
    console.log("Serial bridge disabled. Set SERIAL_PORT in .env to enable hardware stream.");
    return;
  }

  try {
    const port = new SerialPort({
      path: serialPath,
      baudRate: 115200,
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

    port.on("open", () => {
      console.log(`Serial bridge connected on ${serialPath}`);
    });

    port.on("error", (error) => {
      console.error(`Serial bridge error on ${serialPath}:`, error.message);
    });

    parser.on("data", async (data) => {
      console.log(data);
      const match = data.match(/Distance:\s*([\d.]+).*Status:\s*(\w+)/i);

      if (!match) {
        return;
      }

      const distance = Number(match[1]);
      const status = match[2].toUpperCase();

      try {
        await persistSensorReading(
          {
            bin_id: serialBinId,
            distance_cm: distance,
            status,
          },
          io
        );
      } catch (error) {
        console.error("Failed to persist serial sensor reading:", error.message);
      }
    });
  } catch (error) {
    console.error(`Unable to start serial bridge on ${serialPath}:`, error.message);
  }
}


initSerialBridge();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use((req, res, next) => {
  console.log("RAW BODY TEST:", req.headers["content-type"], typeof req.body);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/sensor", sensorRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/map-issues", mapIssueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/translate", translateRoutes);
console.log("Translate route loaded");

app.get("/", (req, res) => {
  res.send("Track Trash Backend is running");
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
