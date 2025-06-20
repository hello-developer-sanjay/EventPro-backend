const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

router.get('/google', (req, res, next) => {
  const platform = req.query.platform || 'eventpro';
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    state: platform,
  })(req, res, next);
});

router.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
  try {
    const user = req.user;
    const platform = req.query.state || 'eventpro';
    user.platform = platform;
    await user.save();
    const token = jwt.sign({ id: user._id }, 'fRwD8ZcX#k5H*J!yN&2G@pQbS9v6E$tA', { expiresIn: '1h' });
    res.redirect(`https://event-ease-unified-event-manager.vercel.app/${platform}?user=${encodeURIComponent(JSON.stringify({ ...user._doc, token }))}`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, platform } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ name, email, password, platform: platform || 'eventpro' });
    await user.save();
    const token = jwt.sign({ id: user._id }, 'fRwD8ZcX#k5H*J!yN&2G@pQbS9v6E$tA', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name, email, role: user.role, platform: user.platform } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, platform } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    user.platform = platform || 'eventpro';
    await user.save();
    const token = jwt.sign({ id: user._id }, 'fRwD8ZcX#k5H*J!yN&2G@pQbS9v6E$tA', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role, platform: user.platform } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, 'fRwD8ZcX#k5H*J!yN&2G@pQbS9v6E$tA');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Load user error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

module.exports = router;
