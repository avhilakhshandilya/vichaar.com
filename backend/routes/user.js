const express = require("express");
const router = express.Router();
const { 
  claimDailyBonus, 
  getPortfolio, 
  getLeaderboard, 
  getPublicProfile, 
  updateProfile,
  updateEmail,
  updatePassword,
  getNotifications,
  markNotificationsRead
} = require("../controllers/userController");

router.post("/claim-bonus", claimDailyBonus);
router.get("/portfolio/:user_id", getPortfolio);
router.get("/leaderboard", getLeaderboard);
router.get("/profile/:username", getPublicProfile);
router.post("/profile/update", updateProfile);
router.post("/profile/email", updateEmail);
router.post("/profile/password", updatePassword);
router.get("/notifications", getNotifications);
router.post("/notifications/read", markNotificationsRead);

module.exports = router;
