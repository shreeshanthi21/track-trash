const router = require("express").Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const { optimizeRoute } = require("../controllers/routeController");

router.get("/optimize", verifyToken, isAdmin, optimizeRoute);

module.exports = router;
