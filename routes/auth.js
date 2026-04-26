const express = require('express');

// Controller file
const {
    register,
    login,
    me,
    logout,
    banUser,
    unbanUser,
    getUsers
} = require('../controllers/auth');

const { updateProfile } = require('../controllers/profile');
const { deleteAccount } = require('../controllers/account');

// Router
const router = express.Router();

// Auth Middleware
const { protect, authorize } = require('../middleware/auth');

// Path and method
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/updateprofile', protect, updateProfile);
router.get('/logout', protect, logout);
router.post('/deleteaccount', protect, deleteAccount);
router.post('/ban', protect, authorize('admin'), banUser);
router.post('/unban', protect, authorize('admin'), unbanUser);
router.get('/getusers', protect, authorize('admin'), getUsers);

module.exports = router;