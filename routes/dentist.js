const express = require('express');

// Controller file
const {
    getDentists,
    getDentist,
    createDentist,
    updateDentist,
    deleteDentist
} = require('../controllers/dentist');

// Router
const router = express.Router();
const reviewRouter = require('./reviews');

// Auth Middleware
const {protect, authorize} = require('../middleware/auth');

router.use('/:dentistId/reviews/',reviewRouter);

// Path and method
router.route('/')
    .get(protect, getDentists)
    .post(protect, authorize('admin'), createDentist); // Only admin can add dentist

router.route('/:id')
    .get(protect, getDentist)
    .put(protect, authorize('admin'), updateDentist) // Only admin can update dentist
    .delete(protect, authorize('admin'), deleteDentist); // Only admin can delete dentist

module.exports = router;