const mongoose = require('mongoose');

// Booking Schema
const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: [true, 'Please add a booking date']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    dentist: {
        type: mongoose.Schema.ObjectId,
        ref: 'Dentist',
        required: [true, 'Please add a dentist']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);