const router = require("express").Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const { getPredictions } = require("../controllers/predictionController");

router.get("/", verifyToken, isAdmin, getPredictions);

module.exports = router;   

