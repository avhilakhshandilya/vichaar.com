const express = require("express");
const router = express.Router();
const { getMarketHistory } = require("../controllers/chartController");

router.get("/:market_id", getMarketHistory);

module.exports = router;
