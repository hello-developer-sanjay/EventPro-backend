const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const passport = require('passport');

// Register a new user
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], authController.register);

// Login user
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], authController.login);


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
console.log('Received request from Google');

router.get('/google/callback', (req, res, next) => {
    console.log('Received callback from Google');
    next();
}, passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    console.log('Google authentication successful, redirecting to dashboard');

    const token = req.user.token; 

    res.redirect(`https://eventpro.vercel.app/dashboard?user=${encodeURIComponent(JSON.stringify(req.user))}&token=${token}`);
});
// Forgot password
router.post('/forgot-password', [
    check('email', 'Please include a valid email').isEmail()
], authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], authController.resetPassword);
// Get authenticated user
router.get('/user', authMiddleware, authController.getAuthenticatedUser);
// Fetch completed certificates for a user


module.exports = router;    
