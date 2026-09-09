function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Authentication must happen before authorization
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // Check whether user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not authorized to access this resource"
      });
    }

    next();
  };
}

module.exports = authorizeRoles;