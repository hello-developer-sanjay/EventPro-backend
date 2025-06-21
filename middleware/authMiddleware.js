const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  console.log('authMiddleware - Token received:', token);

  if (!token) {
    console.log('authMiddleware - No token, authorization denied');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('authMiddleware - Token decoded:', decoded);

    // Handle both token payloads: { id } (authRoutes.js) and { user: { id, role } } (authController.js)
    if (decoded.user) {
      req.user = decoded.user; // authController.js payload
    } else {
      req.user = { id: decoded.id }; // authRoutes.js payload
    }

    // Optional: Verify user exists and platform is 'eventpro'
    const User = require('../models/User');
    User.findById(req.user.id).then(user => {
      if (!user) {
        console.log('authMiddleware - User not found');
        return res.status(401).json({ msg: 'User not found' });
      }
      console.log('authMiddleware - User verified:', user.email);
      next();
    }).catch(err => {
      console.error('authMiddleware - Error finding user:', err.message);
      res.status(401).json({ msg: 'Token is not valid' });
    });
  } catch (err) {
    console.error('authMiddleware - Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
