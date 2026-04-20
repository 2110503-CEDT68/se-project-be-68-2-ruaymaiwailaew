const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    telephone: {
        type: String,
        required: [true, 'Please add a telephone number'],
        match: [
            /^0\d{9}$/,
            'Please add a valid 10-digit phone number starting with 0'
        ]
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: [true, 'This email is already used'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'dentist'],
        default: 'user'
    },
    yearsOfExperience: {
        type: Number,
        min: [0, 'The years of experience cannot be negative number']
    },
    areaOfExpertise: {
        type: String
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password should long more than 5'],
        select: false
    },
    privacyPolicyAccepted: {
        type: Boolean,
        required: [true, 'Please accept privacy policy'],
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    // Only hash password if it has been modified
    if (!this.isModified('password')) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({
        id: this._id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);