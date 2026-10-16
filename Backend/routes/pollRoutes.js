const express = require("express");

const {
  createPoll,
  getPolls,
  getPollById,
  votePoll,
  getPollResults,
  checkPollVote
} = require("../controllers/pollController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getPolls);
router.get("/:id/results", getPollResults);
router.get("/:id", getPollById);

router.post("/", authMiddleware, createPoll);
router.get("/:id/vote", authMiddleware, checkPollVote);
router.post("/:id/vote", authMiddleware, votePoll);

module.exports = router;
