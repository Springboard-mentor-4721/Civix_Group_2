const express = require("express");

const {
  register,
  login
} = require("../controllers/authController");

const {
  getMe
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  registerValidation,
  loginValidation,
  validateRequest
} = require("../middleware/validationMiddleware");

const router = express.Router();


// ===============================
// PUBLIC ROUTES
// ===============================

router.post(
  "/register",
  registerValidation,
  validateRequest,
  register
);

router.post(
  "/login",
  loginValidation,
  validateRequest,
  login
);


// ===============================
// AUTHENTICATED ROUTES
// ===============================

router.get(
  "/me",
  protect,
  getMe
);


module.exports = router;