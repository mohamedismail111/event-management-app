const axios = require("axios");
const FormData = require("form-data");

// Models
const verificationModel = require("../models/verificationModel");

// Services
const { decrypt } = require("../services/secureVerification");

// Middleware: Verify General Access
const verifyAccess = async (req, res, next) => {

    try {

        const verification = await verificationModel.findOne();

        if (!verification) {
            return res.status(403).json({
                data: {
                    success: 2,
                    message: "Verification not found. Access has been restricted.",
                    error: 1,
                },
            });
        }

        next();

    } catch (error) {
        console.error("Error in verifyAccess middleware:", error);
        next();
    }
};

// Middleware: Verify Admin Access
const verifyAdminAccess = async (req, res, next) => {

    try {

        const verification = await verificationModel.findOne();

        // If no verification exists, skip the check
        if (!verification) return next();

        const { key, base_url } = verification;

        // Validate key presence
        if (!key) {
            await verificationModel.deleteMany({});
        }

        // Decrypt the key
        const decryptKey = decrypt(key);

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host') + process.env.BASE_URL;

        // Prepare form data
        const formData = new FormData();
        formData.append("key", decryptKey);
        formData.append("base_url", currentUrl);

        // External API call for verification
        const response = await axios.post(
            "https://templatevilla.net/codecanyon/backend/eventappverify/api/checkverify.php",
            formData,
            { headers: formData.getHeaders() }
        );

        if (response.data?.data?.success === 0) {
            await verificationModel.deleteMany({});
        }

        next();

    } catch (error) {
        console.error("Error in verifyAdminAccess middleware:", error);
        next();
    }
};

module.exports = {
    verifyAccess,
    verifyAdminAccess
};
