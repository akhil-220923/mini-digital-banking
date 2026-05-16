const jwt = require("jsonwebtoken");

exports.verifyUser = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");
    // use a fallback secret for development
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_banking_secret");
    req.user = decoded; // attaching decoded token payload (e.g. { id: user._id })
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

exports.verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_banking_secret");
    
    // Ensure the token specifies it belongs to an admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
