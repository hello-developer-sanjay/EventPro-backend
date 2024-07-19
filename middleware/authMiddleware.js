const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');

module.exports = (req, res, next) => {
    const token = req.header('x-auth-token');


    console.log(token);
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
