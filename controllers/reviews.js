const Review = require('../models/Review');
const User = require('../models/User');

exports.createReview = async (req, res, next) => {
    try {

        const dentist = await User.findById(req.params.dentistId);

        if (!dentist || dentist.role !== 'dentist' || dentist.isDeleted || dentist.isBanned) {
            return res.status(404).json({
                success: false,
                message: 'Dentist not found'
            });
        }

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

        const alreadyReviewed = await Review.findOne({ dentist: req.params.dentistId, user: req.user.id });

        if (alreadyReviewed) {
            return res.status(400).json({
                success: false,
                message: 'User already reviewed this dentist'
            });
        }

        req.body.dentist = req.params.dentistId;
        req.body.user = req.user.id;

        const review = await Review.create(req.body);

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot create review'
        });
    }
};

exports.getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({
            dentist: req.params.dentistId
        }).populate({
            path: 'user',
            select: 'name isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        }).populate({
            path: 'dentist',
            select: 'name isDeleted isBanned',
            match: { isDeleted: false, isBanned: false }
        });

        // Filter out reviews from deleted or banned users
        const filteredReviews = reviews.filter(review => review.user !== null && review.dentist !== null);

        res.status(200).json({
            success: true,
            count: filteredReviews.length,
            data: filteredReviews
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Cannot get review'
        });
    }
};

exports.getReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id).populate('user', 'name').populate('dentist', 'name');

        if (!review) {
            return res.status(404).json({ success: false, message: `Review not found` });
        }

        res.status(200).json({
            success: true,
            data: review
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Cannot get review'
        });
    }
};

exports.updateReview = async (req, res, next) => {
    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: `No review with the id of ${req.params.id}` });
        }

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this review` });
        }

        delete req.body.user;
        delete req.body.dentist;

        review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            data: review
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot update review'
        });
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: `review not found` });
        }

        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete this review` });
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Cannot delete review'
        });
    }
};