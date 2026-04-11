const express = require('express');

// Controller file
const {
    getDentistAvailability,
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking
} = require('../controllers/bookings');

// Router
const router = express.Router();

// Auth Middleware
const {protect, authorize} = require('../middleware/auth');

// Path and method
router.route('/availability')
    .get(protect, authorize('admin','user','dentist'), getDentistAvailability); // Show dentist availability

router.route('/')
    .get(protect, authorize('admin','user','dentist'), getBookings) // admin get all, user get their own, dentist get their bookings
    .post(protect, authorize('user'), createBooking); // Only user can create booking

router.route('/:id')
    .get(protect, authorize('admin','user','dentist'), getBooking)
    .put(protect, authorize('admin','user','dentist'), updateBooking) // dentist can edit their bookings
    .delete(protect, authorize('admin','user','dentist'), deleteBooking);

module.exports = router;