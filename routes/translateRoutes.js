const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { translate } = require("../controllers/translateController");

// POST /api/translate
router.post("/", verifyToken, translate);

module.exports = router;