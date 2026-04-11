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
    .get(protect, authorize('admin','user'), getBookings) // Only admin can get all booking //user only get their own booking
    .post(protect, authorize('user'), createBooking); // Only user can create booking

router.route('/:id')
    .get(protect, authorize('admin','user'), getBooking)
    .put(protect, authorize('admin','user'), updateBooking)
    .delete(protect, authorize('admin','user'), deleteBooking);

module.exports = router;