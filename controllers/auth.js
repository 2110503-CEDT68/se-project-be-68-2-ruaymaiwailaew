const User = require('../models/User');

// Create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token for JWT
    const token = user.getSignedJwtToken();

    // Setting Expires
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    // Is in development?
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        data: user,
        token
    });
};

// @desc    Register
// @route   POST /auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        // Get body request
        const {
            name,
            telephone,
            email,
            password,
            role,
            privacyPolicyAccepted,
            yearsOfExperience,
            areaOfExpertise
        } = req.body;

        // Validate privacy policy acceptance
        if (!privacyPolicyAccepted) {
            return res.status(400).json({
                success: false,
                message: "Please accept the privacy policy to register"
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (existingUser.isDeleted) {
                return res.status(409).json({
                    success: false,
                    message: "This email was previously registered and deleted. Please contact support to reactivate."
                });
            }

            return res.status(409).json({
                success: false,
                message: "Email already in use"
            });
        }

        // Register
        const userData = {
            name,
            telephone,
            email,
            password,
            role,
            privacyPolicyAccepted,
            ...(role === 'dentist' && { yearsOfExperience, areaOfExpertise })
        };

        const user = await User.create(userData);

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
        console.error(err.message);
    }
};

// @desc    Login
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        // Get body request
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email and password"
            });
        }

        // Find user in database
        email.toLowerCase();
        const user = await User.findOne({ email }).select('+password');

        // Don't find user in database
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check if account is deleted
        if (user.isDeleted) {
            return res.status(403).json({
                success: false,
                message: "This account has been deleted"
            });
        }

        // Check if account is banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: `This account has been banned${user.banReason ? ': ' + user.banReason : ''}`
            });
        }

        // Check matched password
        const isMatch = await user.matchPassword(password);

        // Password don't match
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
        console.error(err.message);
    }
};

// @desc    Get current Logged in user
// @route   GET /auth/me
// @access  Private
exports.me = async (req, res, next) => {
    // Find user by id
    const user = await User.findById(req.user.id);

    // Check if account is deleted
    if (user && user.isDeleted) {
        return res.status(400).json({
            success: false,
            message: "This account has been deleted"
        });
    }

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "No user found with this id"
        });
    }

    // Check if account is banned
    if (user.isBanned) {
        return res.status(403).json({
            success: false,
            message: `This account has been banned${user.banReason ? ': ' + user.banReason : ''}`
        });
    }

    res.status(200).json({
        success: true,
        data: user
    });
};

// @desc    Logout / clear cookie
// @route   GET /auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
        data: {}
    });
};

// @desc    Ban user/dentist
// @route   POST /auth/ban
// @access  Private only admin
exports.banUser = async (req, res, next) => {
    try {
        const { userId, reason } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Please provide userId"
            });
        }

        const userToBan = await User.findById(userId);

        if (!userToBan) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (userToBan.isBanned) {
            return res.status(400).json({
                success: false,
                message: "This user is already banned"
            });
        }

        // Ban the user
        userToBan.isBanned = true;
        userToBan.bannedAt = new Date();
        userToBan.banReason = reason || "No reason provided";
        await userToBan.save();

        res.status(200).json({
            success: true,
            message: `${userToBan.role} has been banned successfully`,
            data: {
                userId: userToBan._id,
                email: userToBan.email,
                bannedAt: userToBan.bannedAt,
                banReason: userToBan.banReason
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
        console.error(err.message);
    }
};

// @desc    Unban user/dentist
// @route   POST /auth/unban
// @access  Private only admin
exports.unbanUser = async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Please provide userId"
            });
        }

        const userToUnban = await User.findById(userId);

        if (!userToUnban) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!userToUnban.isBanned) {
            return res.status(400).json({
                success: false,
                message: "This user is not banned"
            });
        }

        // Unban the user
        userToUnban.isBanned = false;
        userToUnban.bannedAt = null;
        userToUnban.banReason = null;
        await userToUnban.save();

        res.status(200).json({
            success: true,
            message: `${userToUnban.role} has been unbanned successfully`,
            data: {
                userId: userToUnban._id,
                email: userToUnban.email
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
        console.error(err.message);
    }
};

// @desc    View all user
// @route   GET /api/auth/getusers
// @access  Private (Admin Only)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find({
            role: { $in: ['user', 'dentist'] },
            isDeleted: false
        }).select('-password');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot retrieve users and dentists"
        });
    }
};