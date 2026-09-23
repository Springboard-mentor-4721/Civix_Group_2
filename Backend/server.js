require("dotenv").config();
require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const governanceRoutes = require("./routes/governanceRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const petitionRoutes = require("./routes/petitionRoutes");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Civix backend is running",
    module: "Milestones 1-3 - Authentication, Petitions & Polling"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/authRoutes"));
const locationRoutes = require("./routes/locationRoutes");
app.use("/api/location", locationRoutes);

app.use("/api/petitions", petitionRoutes);

app.use(
  "/api/governance",
  governanceRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

// Milestone 3 - Polling and Feedback
const pollRoutes = require("./routes/pollRoutes");
app.use("/api/polls", pollRoutes);


const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Civix backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();