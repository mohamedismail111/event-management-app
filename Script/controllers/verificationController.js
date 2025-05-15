// Importing required modules 
const axios = require('axios');
const FormData = require('form-data');

// Importing services
const { decrypt, encrypt } = require("../services/secureVerification");

// Importing models
const verificationModel = require('../models/verificationModel');

// Load and Render the Verification Page
const loadVerification = async (req, res) => {

    try {

        const verificationData = await verificationModel.findOne().sort({ createdAt: -1 });

        const decryptedKey = verificationData ? decrypt(verificationData.key) : null;

        return res.render('verification', {
            verificationKey: decryptedKey,
            hasKey: !!decryptedKey
        });

    } catch (error) {
        console.error("Error loading verification page:", error.message);
        req.flash('error', 'Failed to load verification page');
        return res.redirect(req.get("referer"));
    }
};

// verify the key
const verifyKey = async (req, res) => {

    try {

        // get the key from the request body
        const key = req.body.key;

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host') + process.env.BASE_URL;

        // Define the API URL
        const apiUrl = "https://templatevilla.net/codecanyon/backend/eventappverify/api/response.php";

        // Create form data
        const formData = new FormData();
        formData.append('key', key);
        formData.append('base_url', currentUrl);

        // Send POST request
        const response = await axios.post(apiUrl, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        const responseData = response.data.data;

        if (responseData.success === 1) {

            await verificationModel.create({ key: encrypt(key), base_url: encrypt(currentUrl) });
            
            req.flash('success', responseData.response.message);
            return res.redirect(process.env.BASE_URL + 'verification');
        }
        else {
            req.flash('error', responseData.response.error);
            return res.redirect(process.env.BASE_URL + 'verification');
        }

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Failed to verify key');
        return res.redirect(process.env.BASE_URL + 'verification');
    }
}

// revoke the key
const revokeKey = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host') + process.env.BASE_URL;

        // Define the API URL
        const apiUrl = "https://templatevilla.net/codecanyon/backend/eventappverify/api/revoke.php";

        const verificationData = await verificationModel.findOne().sort({ createdAt: -1 });

        const decryptedKey = verificationData ? decrypt(verificationData.key) : null;

        // Create form data
        const formData = new FormData();
        formData.append('key', decryptedKey);
        formData.append('base_url', currentUrl);

        // Send POST request
        const response = await axios.post(apiUrl, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        const responseData = response.data.data;
        if (responseData.success === 1) {

            // Delete verification data from config
            await verificationModel.findOneAndDelete({ _id: verificationData._id });

            req.flash('success', 'key revoked successfully!');
            return res.redirect(process.env.BASE_URL + 'verification');
        }
        else {
            req.flash('error', responseData.response.error);
            return res.redirect(process.env.BASE_URL + 'verification');
        }

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Failed to revoke key');
        return res.redirect(process.env.BASE_URL + 'verification');
    }
}

module.exports = {
    loadVerification,
    verifyKey,
    revokeKey
}
