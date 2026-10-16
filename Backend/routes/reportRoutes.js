const express = require("express");

const {
  getMonthlyReport,
  exportMonthlyReport
} = require("../controllers/reportController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("official"));

/*
 * Monthly JSON report
 *
 * Example:
 * /api/reports/monthly?month=9&year=2026
 */
router.get(
  "/monthly",
  getMonthlyReport
);

/*
 * Export CSV
 *
 * Example:
 * /api/reports/monthly/export?month=9&year=2026
 */
router.get(
  "/monthly/export",
  exportMonthlyReport
);

module.exports = router;