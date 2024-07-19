const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true
    },
    eventType: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    handledBy: {
        type: String,
        required: true
    },
    organisation: {
        type: String,
        required: true
    },
    totalSubEvents: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
});

module.exports = mongoose.model('Event', EventSchema);
