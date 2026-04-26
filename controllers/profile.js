const User = require('../models/User');

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