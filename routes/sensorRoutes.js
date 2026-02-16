const express = require("express");
const router = express.Router();
const deviceAuth=require("../middleware/deviceAuth");
const { updateSensorData } = require("../controllers/sensorController");
const { verifyToken } = require("../middleware/authMiddleware");
router.post("/update",deviceAuth,updateSensorData);
router.post("/update", verifyToken, updateSensorData);
module.exports = router;

function autoAssign(bin_id){
  db.query(`
    SELECT collector_id
    FROM collections
    GROUP BY collector_id
    ORDER BY COUNT(*) ASC
    LIMIT 1
  `,(e,r)=>{
    if(!r.length) return;
    const collector=r[0].collector_id;
    db.query(
      "INSERT INTO collections (bin_id,collector_id) VALUES (?,?)",
      [bin_id,collector]
    );
  });
}

