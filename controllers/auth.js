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
        const {name, telephone, email, password, role, privacyPolicyAccepted} = req.body;

        // Validate privacy policy acceptance
        if (!privacyPolicyAccepted) {
            return res.status(400).json({
                success: false,
                message: "Please accept the privacy policy to register"
            });
        }

        // Register
        const user = await User.create({
            name,
            telephone,
            email,
            password,
            role,
            privacyPolicyAccepted
        });

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
        const user = await User.findOne({email}).select('+password');

        // Don't find user in database
        if (!user) return res.status(400).json({
            success: false,
            message: "Invalid credentials"
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
        res.status(400).json({
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
        data: {}
    });
};

// @desc    Update user profile
// @route   PUT /auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        // Get fields to update (allow only specific fields)
        const {name, telephone, areaOfExpertise, yearsOfExperience} = req.body;

        // Validate input
        if (!name && !telephone && !areaOfExpertise && yearsOfExperience === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update"
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (name) updateData.name = name;
        if (telephone) updateData.telephone = telephone;
        if (areaOfExpertise) updateData.areaOfExpertise = areaOfExpertise;
        if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: user,
            message: "Profile updated successfully"
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
        console.error(err.message);
    }
};