const express = require('express');

// Controller file
const {register, login, me, logout, updateProfile, deleteAccount} = require('../controllers/auth');

// Router
const router = express.Router();

// Auth Middleware
const {protect} = require('../middleware/auth');

// Path and method
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/updateprofile', protect, updateProfile);
router.get('/logout', protect, logout);
router.delete('/deleteaccount', protect, deleteAccount);

module.exports = router;