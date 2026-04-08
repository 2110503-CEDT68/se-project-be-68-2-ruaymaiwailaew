const Booking = require('../models/Booking');
const Dentist = require('../models/Dentist');
const Review = require('../models/Review');

// @desc    View all dentist
// @route   GET /api/dentist
// @access  Private
exports.getDentists = async (req, res, next) => {
    try {
        // Get all dentists in database
        const dentists = await Dentist.find();

        res.status(200).json({
            success: true,
            count: dentists.length,
            data: dentists
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot find dentists"
        });
    }
};

// @desc    View a dentist
// @route   GET /api/dentist/:id
// @access  Private
exports.getDentist = async (req, res, next) => {
    try {
        // Find dentist by id
        const dentist = await Dentist.findById(req.params.id).populate('reviews');

        // Don't find dentist
        if (!dentist) return res.status(404).json({
            success: false,
            message: `Dentist not found`
        });

        res.status(200).json({
            success: true,
            data: dentist
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot find dentist'
        });
    }
};

// @desc    Create a dentist
// @route   POST /api/dentist
// @access  Private only admin
exports.createDentist = async (req, res, next) => {
    try {
        // Get body request
        const { name, yearsOfExperience, areaOfExpertise } = req.body;

        // Create a dentist in database
        const dentist = await Dentist.create({
            name,
            yearsOfExperience,
            areaOfExpertise
        });

        res.status(201).json({
            success: true,
            data: dentist
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot create dentist'
        });
    }
};

// @desc    Edit a dentist
// @route   PUT /api/dentist/:id
// @access  Private only admin
exports.updateDentist = async (req, res, next) => {
    try {
        // Get body request
        const { name, yearsOfExperience, areaOfExpertise } = req.body;

        // Find dentist by id and update
        const dentist = await Dentist.findByIdAndUpdate(req.params.id, {
            name,
            yearsOfExperience,
            areaOfExpertise
        }, {
            new: true,
            runValidators: true
        });

        // Don't find dentist
        if (!dentist) return res.status(404).json({
            success: false,
            message: `Dentist not found`
        });

        res.status(200).json({
            success: true,
            data: dentist
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot update dentist'
        });
    }
};

// @desc    Delete dentist
// @route   DELETE /api/dentist/:id
// @access  Private only admin
exports.deleteDentist = async (req, res, next) => {
    try {
        // Find dentist by id and delete
        const dentist = await Dentist.findById(req.params.id);

        // Don't find dentist
        if (!dentist) return res.status(404).json({
            success: false,
            message: `Dentist not found`
        });

        await Booking.deleteMany({ dentist: req.params.id });
        await Dentist.deleteOne({ _id: req.params.id });
        await Review.deleteMany({ dentist: req.params.id });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot delete dentist'
        });
    }
};