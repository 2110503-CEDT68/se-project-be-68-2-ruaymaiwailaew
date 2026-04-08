const express = require('express');
const {createReview, getReviews, getReview, updateReview, deleteReview} = require('../controllers/reviews');

const router = express.Router({mergeParams: true});

const {protect, authorize} = require('../middleware/auth');

router.route('/').post(protect,authorize('user'),createReview).get(protect,getReviews);
router.route('/:id').get(protect,getReview).put(protect,authorize('user'),updateReview).delete(protect,authorize('user','admin'),deleteReview);

module.exports = router;