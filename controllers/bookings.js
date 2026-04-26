const Booking = require('../models/Booking');
const User = require('../models/User');
const {
    sendBookingCreatedNotification,
    sendBookingUpdatedNotification,
    sendBookingDeletedNotification
} = require('../services/notificationService');

const logError = (err) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error(err);
    }
};

// @desc    View dentist availability
// @route   GET /api/bookings/availability
// @access  Public
exports.getDentistAvailability = async (req, res, next) => {
    let query; 
    query = Booking.find().populate({
        path: 'dentist',
        select: 'name yearsOfExperience areaOfExpertise isDeleted isBanned',
        match: { isDeleted: false, isBanned: false }
    }).populate({
        path: 'user',
        select: 'name email isDeleted isBanned',
        match: { isDeleted: false, isBanned: false }
    });
    try {
        const bookings = await query;

        // Filter out bookings from deleted or banned users
        const filteredBookings = bookings.filter(booking => booking.user !== null && booking.dentist !== null);

        res.status(200).json({
            success: true,
            count: filteredBookings.length,
            data: filteredBookings
        });
    } catch (err) {
        logError(err);
        res.status(500).json({
            success: false,
            message: "Cannot find bookings"
        });
    }
};

// @desc    View all bookings
// @route   GET /api/bookings
// @access  Private only admin
exports.getBookings = async (req, res, next) => {
    let query;

    if (req.user.role === 'admin') {
        query = Booking.find().populate({
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        }).populate({
            path: 'user',
            select: 'name email isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        });
    } else if (req.user.role === 'user') {
        query = Booking.find({ user: req.user.id }).populate({
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        }).populate({
            path: 'user',
            select: 'name email isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        });
    } else if (req.user.role === 'dentist') {
        query = Booking.find({ dentist: req.user.id }).populate({
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        }).populate({
            path: 'user',
            select: 'name email isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        });
    }

    try {
        const bookings = await query;
        
        // Filter out bookings from deleted or banned users
        const filteredBookings = bookings.filter(booking => booking.user !== null && booking.dentist !== null);

        res.status(200).json({
            success: true,
            count: filteredBookings.length,
            data: filteredBookings
        });
    } catch (err) {
        logError(err);
        res.status(500).json({
            success: false,
            message: "Cannot find bookings"
        });
    }
};

// @desc    View a booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `Booking not found` });
        }

        if (req.user.role === 'admin') {
            // Admin can access any booking
        } else if (req.user.role === 'user') {
            if (booking.user.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this booking'
                });
            }
        } else if (req.user.role === 'dentist') {
            if (booking.dentist._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this booking'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this booking'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        logError(err);
        res.status(500).json({
            success: false,
            message: 'Cannot find booking'
        });
    }
};

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private only user
exports.createBooking = async (req, res, next) => {
    try {
        // Check if user account is deleted or banned
        const user = await User.findById(req.user.id);
        if (user.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Account has been deleted'
            });
        }

        if (user.isBanned) {
            return res.status(400).json({
                success: false,
                message: 'Account has been banned'
            });
        }

        const existedBooking = await Booking.findOne({ user: req.user.id });

        if (existedBooking) {
            return res.status(400).json({ success: false, message: `You already have an existing booking` });
        }

        const { bookingDate, dentist } = req.body;

        if (!bookingDate || !dentist) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking date and dentist'
            });
        }

        // Check if dentist exists and is not deleted or banned
        const dentistUser = await User.findById(dentist);
        if (!dentistUser || dentistUser.isDeleted || dentistUser.isBanned) {
            return res.status(400).json({
                success: false,
                message: 'Dentist is not available'
            });
        }

        const dentistBooking = await Booking.findOne({
            dentist,
            bookingDate: {
                $gte: new Date(new Date(bookingDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(bookingDate).setHours(23, 59, 59, 999))
            }
        });

        if (dentistBooking) {
            return res.status(400).json({
                success: false,
                message: `The dentist is not available on ${new Date(bookingDate).toDateString()}`
            });
        }

        // Prevent booking in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(bookingDate);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create a booking in the past'
            });
        }

        const booking = await Booking.create({
            bookingDate,
            user: req.user.id,
            dentist
        });

        // Send notification email to dentist
        sendBookingCreatedNotification(dentistUser, user, booking);

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (err) {
        logError(err);
        res.status(500).json({
            success: false,
            message: 'Cannot create booking'
        });
    }
};

// @desc    Edit a booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id).populate({
            path: 'dentist',
            select: 'name email yearsOfExperience areaOfExpertise'
        }).populate({
            path: 'user',
            select: 'name email telephone'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (req.user.role === 'admin') {
            // Admin can update any booking
        } else if (req.user.role === 'user') {
            if (booking.user._id.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
            }
        } else if (req.user.role === 'dentist') {
            if (booking.dentist._id.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `Dentist ${req.user.id} is not authorized to update this booking` });
            }
        } else {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
        }

        const {bookingDate, dentist} = req.body;
        const targetDate = bookingDate || booking.bookingDate;

        if (req.body.dentist || req.body.bookingDate) {
            const conflict = await Booking.findOne({
                _id: { $ne: req.params.id },
                dentist: req.body.dentist || booking.dentist._id,
                bookingDate: { 
                    $gte: new Date(new Date(targetDate).setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date(targetDate).setHours(23, 59, 59, 999)) 
                }
            });

            if (conflict) return res.status(400).json({success: false, message: `The dentist is not available on ${new Date(bookingDate).toDateString()}`});
        }

        // Prevent updating booking to a past date
        if (req.body.bookingDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(req.body.bookingDate);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update a booking to a past date'
                });
            }
        }

        const updateData = {};
        if (bookingDate) updateData.bookingDate = bookingDate;
        if (dentist) updateData.dentist = dentist;

        booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate({
            path: 'dentist',
            select: 'name email yearsOfExperience areaOfExpertise'
        }).populate({
            path: 'user',
            select: 'name email telephone'
        });

        // Send notification email to the other party
        if (req.user.role === 'user' || req.user.role === 'admin') {
            // User or admin updated the booking, notify the dentist
            sendBookingUpdatedNotification(booking.dentist, booking, booking.user, 'user');
        } else if (req.user.role === 'dentist') {
            // Dentist updated the booking, notify the user
            sendBookingUpdatedNotification(booking.user, booking, booking.dentist, 'dentist');
        }

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (err) {
        logError(err);
        res.status(500).json({
            success: false,
            message: 'Cannot update booking'
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'dentist',
            select: 'name email yearsOfExperience areaOfExpertise'
        }).populate({
            path: 'user',
            select: 'name email telephone'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `Booking not found` });
        }

        if (req.user.role === 'admin') {
            // Admin can delete any booking
        } else if (req.user.role === 'user') {
            if (booking.user._id.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
            }
        } else if (req.user.role === 'dentist') {
            if (booking.dentist._id.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `Dentist ${req.user.id} is not authorized to delete this booking` });
            }
        } else {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
        }

        await booking.deleteOne();

        // Send notification email to the other party
        if (req.user.role === 'user' || req.user.role === 'admin') {
            // User or admin deleted the booking, notify the dentist
            sendBookingDeletedNotification(booking.dentist, booking, booking.user, 'user');
        } else if (req.user.role === 'dentist') {
            // Dentist deleted the booking, notify the user
            sendBookingDeletedNotification(booking.user, booking, booking.dentist, 'dentist');
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        logError(err);
        res.status(500).json({
            success: false,
            message: 'Cannot delete booking'
        });
    }
};
