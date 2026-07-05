const express = require("express");
const router = express.Router();
const { deposit, withdraw } = require("../controllers/walletController");

router.post("/deposit", deposit);
router.post("/withdraw", withdraw);

module.exports = router;
