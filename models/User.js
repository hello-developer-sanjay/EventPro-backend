const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    googleId: { type: String, unique: true, sparse: true },
    resetPasswordToken: String, 
    resetPasswordExpires: Date,
    date: {
        type: Date,
        default: Date.now
    },
   
});

module.exports = mongoose.model('User', userSchema);
