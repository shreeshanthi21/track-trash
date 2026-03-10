// Generic role checker function
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    // If token not verified or user missing
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Token missing or invalid."
      });
    }

    console.log(`Role check: User role='${req.user.role}', Required='${requiredRole}'`);

    // If role does not match
    if (req.user.role !== requiredRole) {
      console.log(`Role mismatch: Access denied for user role '${req.user.role}'`);
      return res.status(403).json({
        message: `${requiredRole} access only`
      });
    }

    // Role valid → continue
    next();
  };
};

// Export specific role middlewares
exports.isAdmin = checkRole("admin");
exports.isCollector = checkRole("collector");
exports.isUser = checkRole("user");