const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('authRoutes - Google callback token generated:', token);
    res.redirect(`https://event-ease-unified-event-manager.vercel.app/eventpro?platform=eventpro&user=${encodeURIComponent(JSON.stringify({ ...user._doc, token }))}`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      console.log('authRoutes - User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ name, email, password, platform: 'eventpro' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('authRoutes - Register token generated:', token);
    res.json({ token, user: { id: user._id, name, email, role: user.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('authRoutes - Invalid credentials: user not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('authRoutes - Invalid credentials: password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('authRoutes - Login token generated:', token);
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) {
    console.log('authRoutes - No token, authorization denied');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('authRoutes - Token decoded:', decoded);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('authRoutes - User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('authRoutes - User fetched:', user.email);
    res.json({ user });
  } catch (error) {
    console.error('Load user error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

module.exports = router;
