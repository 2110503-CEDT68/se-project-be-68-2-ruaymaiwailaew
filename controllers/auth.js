const User = require('../models/User');

// Create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token for JWT
    const token = user.getSignedJwtToken();

    // Setting Expires
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly: true
    };

    // Is in development?
    if (process.env.NODE_ENV === 'production') {
        options.secure=true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        data: user,
        token
    });
}

// @desc    Register
// @route   POST /auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        // Get body request
        const {name, telephone, email, password, role, privacyPolicyAccepted, yearsOfExperience, areaOfExpertise} = req.body;

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
            name, telephone, email, password, role, privacyPolicyAccepted,
            ...(role === 'dentist' && { yearsOfExperience, areaOfExpertise })
        };

        const user = await User.create(userData);
        
        sendTokenResponse(user, 201, res);
    }catch (err) {
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
        const {email, password} = req.body;

        // Validate email & password
        if (!email || !password) return res.status(400).json({
            success: false,
            message: "Please provide an email and password"
        });

        // Find user in database
        email.toLowerCase();
        const user = await User.findOne({email}).select('+password');

        // Don't find user in database
        if (!user) return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });

        // Check if account is deleted
        if (user.isDeleted) return res.status(403).json({
            success: false,
            message: "This account has been deleted"
        });

        // Check if account is banned
        if (user.isBanned) return res.status(403).json({
            success: false,
            message: `This account has been banned${user.banReason ? ': ' + user.banReason : ''}`
        });

        // Check matched password
        const isMatch = await user.matchPassword(password);

        // Password don't match
        if (!isMatch) return res.status(401).json({
            success: false,
            message: "Invalid password"
        });

        sendTokenResponse(user, 200, res);
    }catch (err) {
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
        expires: new Date(Date.now() + 10*1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
        data: {}
    });
};

// @desc    Delete account (soft delete)
// @route   POST /auth/deleteaccount
// @access  Private
exports.deleteAccount = async (req, res, next) => {
    try {
        const { password } = req.body;

        //Check if password is provided
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Please provide your password to confirm account deletion"
            });
        }

        //Find user by ID and include password field
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isDeleted) {
            return res.status(410).json({
                success: false,
                message: "This account has already been deleted"
            });
        }

        //(Fix) Verify password BEFORE modifying any data
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        //Password is correct, proceed with soft delete
        user.isDeleted = true;
        user.deletedAt = new Date();
        await user.save();

        // 5. Clear cookie (Logout user)
        res.cookie('token', 'none', {
            expires: new Date(0),
            httpOnly: true
        });

        //Send response
        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
            data: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Ban user/dentist
// @route   POST /auth/ban
// @access  Private only admin
exports.banUser = async (req, res, next) => {
    try {
        const {userId, reason} = req.body;

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
        const {userId} = req.body;

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

// @desc    Update user profile
// @route   PUT /auth/updateprofile
// @access  Private
// @desc    Update user profile
// @route   PUT /auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        //Extract inputs from request body
        const { name, telephone, areaOfExpertise, yearsOfExperience, password } = req.body;

        //Require password for security confirmation
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Please provide your password to confirm profile update"
            });
        }

        //Find the user making the request and include password for verification
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        //Verify password before allowing any updates
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        //Build the update object securely based on user role (Prevent Mass Assignment)
        const updateData = {};

        //Common fields for all user roles
        if (name) updateData.name = name;
        if (telephone) updateData.telephone = telephone;

        //Role-specific fields (ONLY allowed if the user is a dentist)
        if (user.role === 'dentist') {
            if (areaOfExpertise) updateData.areaOfExpertise = areaOfExpertise;
            if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
        }

        //Check if there is actually anything to update after filtering
        //This prevents unnecessary database calls if a normal user sends ONLY dentist fields
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one valid field to update"
            });
        }

        //Execute the update
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            {
                new: true, // Return the updated document
                runValidators: true // Ensure new data meets schema validation rules
            }
        );

        //Send success response
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    View all user
// @route   GET /api/auth/getusers
// @access  Private (Admin Only)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $in: ['user', 'dentist'] }, isDeleted: false }).select('-password');

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