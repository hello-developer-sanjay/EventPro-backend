const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Register a new user
const register = async (req, res) => {
  console.log('Register endpoint hit');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array(), success: false });
  }

  const { name, email, password, role } = req.body;
  console.log('Registering user with email:', email);

  try {
    let user = await User.findOne({ email });
    console.log('User lookup result:', user);

    if (user) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists', success: false });
    }

    user = new User({
      name,
      email,
      password,
      role: role || 'user',
      platform: 'eventpro', // Set platform for consistency
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    console.log('Password hashed');

    await user.save();
    console.log('User saved:', user);

    const payload = {
      id: user.id, // Standardize payload to match authRoutes.js
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      console.log('JWT token generated:', token);
      res.json({ token, user: { id: user.id, name, email, role: user.role }, success: true });
    });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).send({ message: 'Server Error', success: false });
  }
};

// Login user
const login = async (req, res) => {
  console.log('Login endpoint hit');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  console.log('Logging in user with email:', email);

  try {
    let user = await User.findOne({ email });
    console.log('User lookup result:', user);

    if (!user) {
      console.log('Invalid credentials: user not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Invalid credentials: password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id, // Standardize payload
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      console.log('JWT token generated:', token);
      res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).send('Server Error');
  }
};

// Get authenticated user
const getAuthenticatedUser = async (req, res) => {
  console.log('Get authenticated user endpoint hit');
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('Authenticated user found:', user);
    res.json({ user });
  } catch (error) {
    console.error('Error fetching authenticated user:', error.message);
    res.status(500).send('Server Error');
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  console.log('Forgot password endpoint hit');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  console.log('Forgot password for email:', email);

  try {
    let user = await User.findOne({ email });
    console.log('User lookup result:', user);

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'User not found' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Reset password token generated:', token);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    console.log('User updated with reset password token');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'workrework.sanjay@gmail.com',
        pass: 'nnefpkztnuxukzsm',
      },
    });

    const mailOptions = {
      from: 'workrework.sanjay@gmail.com',
      to: email,
      subject: 'Reset Password',
      text: `You are receiving this email because you (or someone else) have requested to reset the password for your account. Please click on the following link to reset your password: https://event-ease-unified-event-manager.vercel.app/eventpro/reset-password/${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send reset password email' });
      }
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Reset password email sent successfully' });
    });
  } catch (error) {
    console.error('Error during forgot password:', error.message);
    res.status(500).send('Server Error');
  }
};

// Reset password
const resetPassword = async (req, res) => {
  console.log('Reset password endpoint hit');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { password } = req.body;
  const { token } = req.params;
  console.log('Resetting password with token:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    console.log('User lookup result:', user);

    if (!user) {
      console.log('Invalid or expired token');
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    console.log('Password hashed');

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log('User updated with new password');

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during reset password:', error.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  register,
  login,
  getAuthenticatedUser,
  forgotPassword,
  resetPassword,
};
