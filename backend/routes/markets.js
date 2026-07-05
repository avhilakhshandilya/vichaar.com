const express = require("express");
const router = express.Router();
const { vote, resolveMarket, createMarket, getActivityFeed } = require("../controllers/marketController");

router.post("/vote", vote);
router.post("/resolve", resolveMarket);
router.post("/create", createMarket);
router.get("/activity", getActivityFeed);

module.exports = router;
