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

router.get(
  "/official-test",
  protect,
  authorizeRoles("official"),
  (req, res) => {
    res.status(200).json({
      message: "Official authorization verified",
      user: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      }
    });
  }
);


module.exports = router;