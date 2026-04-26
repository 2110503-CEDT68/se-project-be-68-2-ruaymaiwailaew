const User = require('../models/User');

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