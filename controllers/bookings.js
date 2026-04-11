const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    View dentist availability
// @route   GET /api/bookings/availability
// @access  Private
exports.getDentistAvailability = async (req, res, next) => {
    try {
        // Get all dentists
        const dentists = await User.find({ role: 'dentist' }).select('_id name yearsOfExperience areaOfExpertise telephone email');

        // Get all bookings with dentist info
        const bookings = await Booking.find().populate({
            path: 'dentist',
            select: 'name'
        }).populate({
            path: 'user',
            select: 'name email'
        });

        // Create availability map
        const availability = dentists.map(dentist => {
            const dentistBookings = bookings.filter(booking => 
                booking.dentist._id.toString() === dentist._id.toString()
            );

            return {
                dentistId: dentist._id,
                name: dentist.name,
                yearsOfExperience: dentist.yearsOfExperience,
                areaOfExpertise: dentist.areaOfExpertise,
                telephone: dentist.telephone,
                email: dentist.email,
                bookedDates: dentistBookings.map(booking => ({
                    bookingId: booking._id,
                    bookingDate: booking.bookingDate,
                    bookedBy: booking.user.name,
                    bookedByEmail: booking.user.email
                }))
            };
        });

        res.status(200).json({
            success: true,
            count: availability.length,
            data: availability
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot find dentist availability"
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
            select: 'name yearsOfExperience areaOfExpertise'
        }).populate({
            path: 'user',
            select: 'name email'
        });
    } else if (req.user.role === 'user') {
        query = Booking.find({ user: req.user.id }).populate({
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise'
        }).populate({
            path: 'user',
            select: 'name email'
        });
    } else if (req.user.role === 'dentist') {
        query = Booking.find({ dentist: req.user.id }).populate({
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise'
        }).populate({
            path: 'user',
            select: 'name email'
        });
    }

    try {
        const bookings = await query;

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        console.log(err);
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
            if (booking.dentist.toString() !== req.user.id) {
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
        console.log(err);
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
        const existedBooking = await Booking.findOne({ user: req.user.id });

        if (existedBooking) {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already made booking` });
        }

        const { bookingDate, dentist } = req.body;

        const booking = await Booking.create({
            bookingDate,
            user: req.user.id,
            dentist
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (err) {
        console.log(err);
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
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (req.user.role === 'admin') {
            // Admin can update any booking
        } else if (req.user.role === 'user') {
            if (booking.user.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
            }
        } else if (req.user.role === 'dentist') {
            if (booking.dentist.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `Dentist ${req.user.id} is not authorized to update this booking` });
            }
        } else {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (err) {
        console.log(err);
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
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `Booking not found` });
        }

        if (req.user.role === 'admin') {
            // Admin can delete any booking
        } else if (req.user.role === 'user') {
            if (booking.user.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
            }
        } else if (req.user.role === 'dentist') {
            if (booking.dentist.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: `Dentist ${req.user.id} is not authorized to delete this booking` });
            }
        } else {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot delete booking'
        });
    }
};
