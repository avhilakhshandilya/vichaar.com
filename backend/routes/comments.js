const express = require("express");
const router = express.Router();
const { addComment, getComments } = require("../controllers/commentController");

router.post("/", addComment);
router.get("/:market_id", getComments);

module.exports = router;
