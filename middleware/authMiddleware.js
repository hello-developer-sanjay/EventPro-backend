const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth'); 
const User = require('../models/User');
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
    req.user = decoded.user;
    if (req.user.platform !== 'eventpro') {
      console.log('authMiddleware - Invalid platform');
      return res.status(401).json({ msg: 'Invalid platform' });
    }
    next();
  } catch (err) {
    console.error('authMiddleware - Token is not valid:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
