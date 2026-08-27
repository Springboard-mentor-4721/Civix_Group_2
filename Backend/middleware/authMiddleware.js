const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check Bearer token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // 3. Extract token
    const token = authHeader.split(" ")[1];

    // 4. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 5. Find user using the numeric ID stored in JWT
    const user = await User.findOne({
      id: decoded.userId
    });

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists"
      });
    }

    // 6. Attach user to request
    req.user = user;

    // 7. Continue to protected controller
    next();

  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

module.exports = protect;