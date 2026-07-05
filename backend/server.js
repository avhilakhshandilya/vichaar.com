require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const marketsRoutes = require("./routes/markets");
const userRoutes = require("./routes/user");
const chartRoutes = require("./routes/charts");
const commentRoutes = require("./routes/comments");
const walletRoutes = require("./routes/wallet");
const { startCronJobs } = require('./cron/marketSeeder');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/markets", marketsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/charts", chartRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/wallet", walletRoutes);

// Start Cron Jobs
startCronJobs();

// Test route
app.get("/", (req, res) => {
  res.send("Vichaar Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// 