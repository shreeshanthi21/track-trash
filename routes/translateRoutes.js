const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { translate } = require("../controllers/translateController");

// POST /api/translate
router.post("/", translate);

module.exports = router;