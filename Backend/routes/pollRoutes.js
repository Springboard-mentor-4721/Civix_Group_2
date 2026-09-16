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

router.use(authMiddleware);

router.post("/", createPoll);
router.get("/", getPolls);
router.get("/:id/results", getPollResults);
router.get("/:id/vote", checkPollVote);
router.post("/:id/vote", votePoll);
router.get("/:id", getPollById);

module.exports = router;
