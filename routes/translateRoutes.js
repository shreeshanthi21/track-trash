// routes/translateRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { translate } = require("../controllers/translateController.js");

// POST /api/translate
router.post("/", verifyToken, translate);

module.exports = router;