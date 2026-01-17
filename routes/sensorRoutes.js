const express = require("express");
const router = express.Router();

const { updateSensorData } = require("../controllers/sensorController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/update", verifyToken, updateSensorData);


module.exports = router;
