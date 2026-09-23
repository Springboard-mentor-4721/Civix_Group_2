const express = require("express");

const {
  getLocalPetitions,
  getGovernancePetition,
  respondToPetition,
  getResponseHistory
} = require("../controllers/governanceController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("official"));

/*
 * GET all petitions belonging to
 * official's locality
 */
router.get(
  "/petitions",
  getLocalPetitions
);

/*
 * GET one petition
 */
router.get(
  "/petitions/:id",
  getGovernancePetition
);

/*
 * Official responds to petition
 */
router.post(
  "/petitions/:id/respond",
  respondToPetition
);

/*
 * Response history
 */
router.get(
  "/petitions/:id/responses",
  getResponseHistory
);

module.exports = router;