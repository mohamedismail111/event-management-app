// Importing required modules 
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");

// Importing models
const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");
const forgotPassowrdOtpModel = require("../models/forgotPasswordOtpModel");
const userNotificationModel = require("../models/userNotificationModel");
const splashModel = require("../models/splashModel");
const categoryModel = require("../models/categoryModel");
const organizerModel = require("../models/organizerModel");
const sponsorModel = require("../models/sponsorModel");
const tagModel = require("../models/tagModel");
const eventModel = require("../models/eventModel");
const ticketModel = require("../models/ticketModel");
const favouriteEventModel = require("../models/favouriteEventModel");
const couponModel = require("../models/couponModel");
const pageModel = require("../models/pageModel");
const currencyTimezoneModel = require("../models/currencyTimezoneModel");
const paymentGatewayModel = require("../models/paymentGatewayModel");
const notificationModel = require("../models/notificationModel");

// Importing the service function to delete image
const { deleteImages } = require("../services/deleteImage");

// Importing the function to send otp mail
const sendOtpMail = require("../services/sendOtpMail");

// Importing the function to send notification
const { sendAdminNotification } = require("../services/sendPushNotification");

// Importing the service function to change ticket status
const changeTicketStatus = require("../services/changeTicketStatus");

// Importing the service function to change event completed status
const { markPastEventsAsCompleted } = require("../services/markPastEventsAsCompleted");

// Importing the cache function
const { getCachedData, setCachedData, clearAllCache } = require("../services/cache");


// Check Register User
const checkregisteruser = async (req, res) => {

    try {

        // Extract data from the request
        const email = req.body.email;

        // Validate email
        if (!email) {
            return res.json({ data: { success: 0, message: "Email is required", error: 1 } });
        }

        // Check if user already exists
        const isExisting = await userModel.findOne({ email: email });

        if (!isExisting) {

            return res.json({ data: { success: 1, message: "User does not exist, please sign up", error: 0 } });

        } else {

            return res.json({ data: { success: 0, message: "User already exists", error: 1 } });
        }

    } catch (error) {
        console.log("Error during check register user", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }

}

// sign up
const signup = async (req, res) => {

    try {

        // Extract data from the request body
        const { name, email, country_code, phone, password, country } = req.body;

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ data: { success: 0, message: 'User already exists', error: 1 } });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user
        const newUser = new userModel({ name, email, country_code, phone, password: hashedPassword, country });

        const savedUser = await newUser.save();

        if (!savedUser) {
            return res.status(500).json({ data: { success: 0, message: 'Something went wrong. Please try again...', error: 1 } });
        }

        // generate otp
        const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, });

        // Save OTP 
        const otpDoc = await otpModel.findOneAndUpdate({ email: email }, { $set: { email: email, otp: otp, } }, { upsert: true, new: true, });

        // Send OTP email
        try {

            await sendOtpMail(otp, email, name);

        } catch (emailError) {
            return res.json({ data: { success: 0, message: "Something went wrong. Please try again...", error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Successfully signed up! Please check your email to verify OTP.", error: 0 } });

    } catch (error) {
        console.log("Error during sign up", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

//  verify otp
const verifyotp = async (req, res) => {

    try {

        // Extract data from the request body
        const email = req.body.email;
        const otp = req.body.otp;

        // Validate email and otp
        if (!email || !otp) {
            return res.json({ data: { success: 0, message: "Email and OTP is required", error: 1 } });
        }

        // Check if there is an OTP record for the given email
        const user = await otpModel.findOne({ email: email });

        if (!user) {
            return res.json({ data: { success: 0, message: "Email not found. Please try again...", error: 1 } });
        }

        if (otp !== user.otp) {

            return res.json({ data: { success: 0, message: "Incorrect OTP. Please try again...", error: 1 } });
        }

        // Update the otp verify status
        const updatedUser = await userModel.findOneAndUpdate({ email }, { $set: { isVerified: true } });

        // Generate token
        const token = jwt.sign({ id: updatedUser._id, email }, process.env.JWT_SECRET_KEY);

        // Exclude sensitive fields from the user object
        const filteredUser = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            country_code: updatedUser.country_code,
            phone: updatedUser.phone,
            is_active: updatedUser.is_active
        };

        // Delete otp
        await otpModel.deleteOne({ email });

        // Update user notification data
        const { registrationToken, deviceId } = req.body;

        await userNotificationModel.updateOne({ userId: updatedUser._id, deviceId }, { $set: { registrationToken } }, { upsert: true, new: true });

        return res.json({ data: { success: 1, message: "OTP verified successfully", token, user: filteredUser, error: 0 } });

    } catch (error) {
        console.log("Error during verify otp", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// add interested category
const interestedCategory = async (req, res) => {

    try {

        // Extract data from the request body
        const email = req.body.email;
        const interestCategoryId = req.body.interestCategory;

        // fetch user
        const user = await userModel.findOne({ email: email });

        if (!user) return res.json({ data: { success: 0, message: "User not found", error: 1 } });

        if (user.isVerified === false) return res.json({ data: { success: 0, message: "User verification is required to add a category", error: 1 } });

        // Check if the interest category
        const interestCategory = user.interestCategoryId || [];

        // Update the interest category id
        await userModel.updateOne({ _id: user._id }, { $set: { interestCategoryId: interestCategory.concat(interestCategoryId) } });

        return res.json({ data: { success: 1, message: "Interest category added successfully", error: 0 } });

    } catch (error) {
        console.log("Error during add interested category", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// sign in
const signin = async (req, res) => {

    try {

        // Extract data from the request body
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.json({ data: { success: 0, message: "Email and password is required", error: 1 } });
        }

        // fetch particular user
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ data: { success: 0, message: "We're sorry, something went wrong when attempting to sign in.", error: 1 } });
        }

        // compare password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.json({ data: { success: 0, message: "We're sorry, something went wrong when attempting to sign in.", error: 1 } });
        }

        if (user.is_active === false) {
            return res.json({ data: { success: 0, message: "Your account has been banned. Please contact support for more details.", error: 1 } });
        }

        // generate token
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET_KEY);

        // Exclude sensitive fields from the user object
        const filteredUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            country_code: user.country_code,
            phone: user.phone,
            is_active: user.is_active
        };

        // Update user notification data
        const { registrationToken, deviceId } = req.body;

        await userNotificationModel.updateOne({ userId: user._id, deviceId }, { $set: { registrationToken } }, { upsert: true });

        // response based on user verification status
        if (!user.isVerified) {

            return res.json({ data: { success: 1, message: "Login successful ..., but your account is pending verification. Please check your email to complete the verification process.", token, user: filteredUser, error: 0 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Logged in successfully.", token, user: filteredUser, error: 0 } });
        }

    } catch (error) {
        console.log("Error during sign in", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// is verify account
const isverifyaccount = async (req, res) => {

    try {

        // Extract data from the request body
        const email = req.body.email;

        // Validate email
        if (!email) {
            return res.json({ data: { success: 0, message: "Email is required", error: 1 } });
        }

        // fetch user
        const existingUser = await userModel.findOne({ email: email });

        if (!existingUser) {
            return res.json({ data: { success: 0, message: "User not found", error: 1 } });
        }

        if (!existingUser.isVerified) {
            return res.json({ data: { success: 0, message: "Your account is not verified. Please verify your account...", error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Your account has been successfully verified.", error: 0 } });
        }

    } catch (error) {
        console.log("Error during is verify account", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// resend otp
const resendotp = async (req, res) => {

    try {

        // Extract data from the request body
        const email = req.body.email;

        // Validate email
        if (!email) {
            return res.json({ data: { success: 0, message: "Email is required", error: 1 } });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email: email });

        if (!existingUser) {
            return res.json({ data: { success: 0, message: "User not found", error: 1 } });
        }

        if (existingUser.isVerified === true) {
            return res.json({ data: { success: 0, message: "Your account is already verified.", error: 1 } });
        }

        // generate otp
        const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        // Save OTP 
        const otpDoc = await otpModel.findOneAndUpdate({ email: email }, { $set: { email: email, otp: otp, } }, { new: true, upsert: true });

        // Send OTP email
        try {

            await sendOtpMail(otp, email, existingUser.name);

        } catch (emailError) {
            return res.json({ data: { success: 0, message: "Something went wrong. Please try again...", error: 1 } });
        }

        return res.json({ data: { success: 1, message: "We've sent an OTP to your email. Please check your inbox to verify your account.", error: 0 } });

    } catch (error) {
        console.log("Error during verify Account", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// forgot password
const forgotpassword = async (req, res) => {

    try {

        // Extract data from the request body
        const email = req.body.email;

        // Validate email
        if (!email) {
            return res.json({ data: { success: 0, message: "Email is required", error: 1 } });
        }

        // Check if email exists 
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ data: { success: 0, message: "Incorrect Email, please try again...", error: 1 } });
        }

        // Generate OTP
        const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        // save OTP
        let otpRecord = await forgotPassowrdOtpModel.findOneAndUpdate({ email }, { otp }, { upsert: true, new: true });

        // Send OTP email
        try {

            await sendOtpMail(otp, email, user.name);

        } catch (emailError) {
            return res.json({ data: { success: 0, message: "Something went wrong. Please try again...", error: 1 } });
        }

        return res.json({ data: { success: 1, message: "We've sent an OTP to your email. Please check your inbox to reset your password.", error: 0 } });

    } catch (error) {
        console.log("Error during forgot password", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// forgot password otp verification
const forgotpasswordotpverification = async (req, res) => {

    try {

        const { email, otp } = req.body;

        // Validate email and otp
        if (!email || !otp) {
            return res.json({ data: { success: 0, message: "Email and OTP is required", error: 1 } });
        }

        // Check if there is an OTP record for the given email
        const otpRecord = await forgotPassowrdOtpModel.findOne({ email });

        if (!otpRecord) {
            return res.json({ data: { success: 0, message: "Incorrect Email. Please try again...", error: 1 } });
        }

        // Check if the provided OTP matches the stored OTP
        if (otp !== otpRecord.otp) {
            return res.json({ data: { success: 0, message: "Incorrect OTP. Please try again...", error: 1 } });
        }

        // Update the OTP verification status
        otpRecord.isVerified = true;
        await otpRecord.save();

        return res.json({ data: { success: 1, message: "OTP verified successfully", error: 0 } });

    } catch (error) {
        console.log("Error during forgot password otp verification", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// reset password
const resetpassword = async (req, res) => {

    try {

        // Extract data from request
        const { email, new_password } = req.body;

        // Validate email and otp
        if (!email || !new_password) {
            return res.json({ data: { success: 0, message: "Email and password is required", error: 1 } });
        }

        // Check if there is an OTP record for the given email
        const otpRecord = await forgotPassowrdOtpModel.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({ data: { success: 0, message: "Invalid email. Please try again", error: 1 } });
        }

        // Check if the user's OTP is not verified
        if (!otpRecord.isVerified) {
            return res.status(400).json({ data: { success: 0, message: "Please verify your OTP first", error: 1 } });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password
        await userModel.findOneAndUpdate({ email: email }, { $set: { password: hashedPassword } }, { new: true });

        // Delete the OTP record from the OTP model after verification
        await forgotPassowrdOtpModel.deleteOne({ email });

        return res.json({ data: { success: 1, message: "Successfully reset password", error: 0 } });

    } catch (error) {
        console.error("Error during reset password", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
};

// get user 
const getuser = async (req, res) => {

    try {

        // Extract data from the request body
        const userId = req.user;

        // fetch user details using id
        const user = await userModel.findOne({ _id: userId }, { password: 0, isVerified: 0 }).populate("interestCategoryId", "_id  avatar category");

        // Check if the user is not found
        if (!user) {

            return res.json({ data: { success: 0, message: "User Not Found", user, error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "User Found", user, error: 0 } });
        }

    } catch (error) {
        console.error("Error during  get user details", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Upload Image
const uploadimage = async (req, res) => {

    try {

        // Extract data from the request
        const avatar = req.file.filename;

        // Checking if the image file exists
        if (avatar) {
            return res.json({ data: { success: 1, message: "Image Uploaded Successfully", avatar: avatar, error: 0 } });
        }
        else {
            return res.json({ data: { success: 0, message: "Image Not uploaded", error: 1 } });
        }

    } catch (error) {
        console.log("Error during upload image:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// user edit
const useredit = async (req, res) => {

    try {

        // Extract data from the request body
        const userId = req.user;
        const name = req.body.name;
        const country_code = req.body.country_code;
        const phone = req.body.phone;
        const country = req.body.country;
        const gender = req.body.gender;
        const birthdate = req.body.birthdate;
        const newImage = req.body ? req.body.avatar : null;
        const about = req.body.about;
        const interestCategory = req.body.interestCategory;

        // Find the user by ID
        const user = await userModel.findOne({ _id: userId });

        if (!user) return res.json({ data: { success: 0, message: "User not found", error: 1 } });

        // Handle image updates
        let avatar = user.avatar;
        if (newImage && newImage !== user.avatar) {
            if (user.image) {
                // Delete the old image if it exists
                deleteImages(user.avatar);
            }
            avatar = newImage;
        }

        // update user details
        const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, { $set: { avatar, name, country_code, phone, country, gender, birthdate, about, interestCategoryId: interestCategory } }, { new: true });

        if (!updatedUser) return res.json({ data: { success: 0, message: "Profile update failed", error: 1 } });

        return res.json({ data: { success: 1, message: "Profile updated successfully", error: 0 } });

    } catch (error) {
        console.log("Error during edit user", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Change password for user
const changepassword = async (req, res) => {

    try {

        // Extract data from the request
        const userId = req.user;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        // compare
        if (newPassword !== confirmPassword) {

            return res.json({ data: { success: 0, message: "Confirm password does not match", error: 1 } });
        }

        // fetch user password
        const userData = await userModel.findById(userId);

        // compare password
        const passwordMatch = await bcrypt.compare(currentPassword, userData.password);

        if (!passwordMatch) {
            return res.json({ data: { success: 0, message: "Incorrect current password. Please enter the correct password and try again...", error: 1 } });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update password
        const updatedPassword = await userModel.findByIdAndUpdate({ _id: userId }, { $set: { password: hashedPassword } }, { new: true });

        return res.json({ data: { success: 1, message: "Password changed successfully", error: 0 } });

    } catch (error) {
        console.log("Error during change password:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// delete account for user
const deleteaccountuser = async (req, res) => {

    try {

        // Extract data from the request
        const userId = req.user;

        // fetch user
        const user = await userModel.findOne({ _id: userId });

        if (!user) {
            return res.json({ data: { success: 0, message: "User Not Found", error: 1 } });
        }

        if (user.image) {
            // delete user image
            deleteImages(user.image);
        }

        // favourite event
        await favouriteEventModel.deleteMany({ userId: userId });

        // delete user device
        await userNotificationModel.deleteMany({ userId: userId });

        // delete notification
        await notificationModel.deleteMany({ recipient_user: userId })

        // Update ticket to set userId to null in items where userId matches
        await ticketModel.updateMany({ userId: userId }, { $set: { userId: null } });

        //  delete user
        await userModel.deleteOne({ _id: userId });

        return res.json({ data: { success: 1, message: "Successfully deleted user", error: 0 } });

    } catch (error) {
        console.log("Error during delete account", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all splash 
const splash = async (req, res) => {

    try {

        //fetch all splash
        const splash = await splashModel.find({ status: "Publish" }, { status: 0 });

        if (!splash.length) return res.json({ data: { success: 0, message: "Splash Not Found", splash: splash, error: 1 } });

        return res.json({ data: { success: 1, message: "Splash Found", splash: splash, error: 0 } });

    } catch (error) {
        console.log("Error during get all splash", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all category
const allcategory = async (req, res) => {

    try {

        // fetch all categories with status "Publish"
        const categories = await categoryModel.find({ status: "Publish" }, { status: 0 });

        if (!categories.length) return res.json({ data: { success: 0, message: "Categories Not Found", category: categories, error: 1 } });

        return res.json({ data: { success: 1, message: "Categories Found", category: categories, error: 0 } });

    } catch (error) {
        console.log("Error during get all categories", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all organizers
const organizer = async (req, res) => {

    try {

        // fetch all organizers with status "Publish"
        const organizers = await organizerModel.find({ status: "Publish" }, { status: 0, password: 0 });

        if (!organizers.length) return res.json({ data: { success: 0, message: "Organizers Not Found", organizer: organizers, error: 1 } });

        return res.json({ data: { success: 1, message: "Organizers Found", organizer: organizers, error: 0 } });

    } catch (error) {
        console.log("Error during get all organizers", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all sponsors
const sponsor = async (req, res) => {

    try {

        // fetch all sponsors 
        const sponsors = await sponsorModel.find({ status: "Publish" }, { status: 0 });

        if (!sponsors.length) return res.json({ data: { success: 0, message: "Sponsors Not Found", sponsor: sponsors, error: 1 } });

        return res.json({ data: { success: 1, message: "Sponsors Found", sponsor: sponsors, error: 0 } });

    } catch (error) {
        console.log("Error during get all sponsors", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all event
const eventdetails = async (req, res) => {

    try {

        // Mark past events as Completed
        const updatedCount = await markPastEventsAsCompleted();

        // Extract data from the request body
        const eventId = req.body.eventId;
        const categoryId = req.body.categoryId;

        // Generate a unique cache key
        const cacheKey = eventId ? categoryId ? `dynamically-cache-${eventId - categoryId}` : `dynamically-cache-${eventId}` : categoryId ? `dynamically-cache-${categoryId}` : "dynamically-cache";;

        // Check if the data is in the cache
        let updatedEvent = getCachedData(cacheKey);
        if (updatedEvent) {
            console.log('Serving from cache');
            return res.json({ data: { success: 1, message: "Event Found", event: updatedEvent, error: 0 } });
        }

        console.log("Fetching all event data from API...");
        let filters = {
            status: "Publish",
            is_completed: "Upcoming"
        };

        if (eventId) filters._id = eventId;

        if (categoryId) filters.categoryId = categoryId;

        // Fetch events based on filters
        const events = await eventModel.find(filters, { status: 0, is_completed: 0 }).lean()
            .populate("categoryId", "_id avatar category").populate("organizerId", "_id avatar organizer email")
            .populate("sponsorId", "_id avatar sponsor").populate("tagId", "name");

        if (!events.length) return res.json({ data: { success: 0, message: "Event Not Found", event: [], error: 1 } });

        updatedEvent = events.map((item) => {
            // Include the feature image in the gallery if it exists
            let galleryImg = item.galleryImg || [];
            if (item.avatar && !galleryImg.includes(item.avatar)) {
                galleryImg.unshift(item.avatar);
            }
            return item;
        })

        // Cache the result
        setCachedData(cacheKey, updatedEvent);

        return res.json({ data: { success: 1, message: "Event Found", event: updatedEvent, error: 0 } });

    } catch (error) {
        console.log("Error during get all event", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// search event
const search = async (req, res) => {

    try {

        // Extracting and formatting the search keyword from the request body
        const searchKeyword = req.body.searchKeyword?.trim();

        // Remove spaces and convert to lowercase for comparison
        const formattedSearchKeyword = searchKeyword.replace(/\s+/g, '').toLowerCase();

        // Mark past events as Completed
        const updatedCount = await markPastEventsAsCompleted();

        // Get all published events and populate necessary fields
        const events = await eventModel.find({ status: "Publish", is_completed: "Upcoming" }, { status: 0, is_completed: 0 })
            .populate("categoryId", "_id avatar category").populate("organizerId", "_id avatar organizer email")
            .populate("sponsorId", "_id avatar sponsor").populate("tagId", "name");

        // serach service name
        const searchEvent = events.filter((item) => {
            // Remove spaces and convert to lowercase for comparison
            const formattedEventName = item.event.replace(/\s+/g, '').toLowerCase();
            return formattedEventName ? formattedEventName.includes(formattedSearchKeyword) : true;
        });

        if (!searchEvent.length) return res.json({ data: { success: 0, message: "Event Not  Found", event: searchEvent, error: 1 } });

        const updatedEvent = searchEvent.map((item) => {
            // Include the feature image in the gallery if it exists
            let galleryImg = item.galleryImg || [];
            if (item.avatar && !galleryImg.includes(item.avatar)) {
                galleryImg.unshift(item.avatar);
            }
            return item;
        })

        return res.json({ data: { success: 1, message: "Event Found", event: updatedEvent, error: 0 } });

    } catch (error) {
        console.log("Error during search event", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
};

// get all tag
const getAllTag = async (req, res) => {
    try {

        let updatedTagData;

        //    Generate a unique cache key
        const cacheKey = "dynamically-tag-cache";

        updatedTagData = getCachedData(cacheKey);

        if (updatedTagData) {
            console.log("Fetching all tag data from cache...");
            return res.json({ data: { success: 1, message: "Tag Found", tag: updatedTagData, error: 0 } });
        }

        // fetch tag
        const tag = await tagModel.find();

        if (!tag.length) return res.json({ data: { success: 0, message: "Tag Not Found", tag: tag, error: 1 } });

        // Mark past events as Completed 
        const updatedCount = await markPastEventsAsCompleted();

        updatedTagData = await Promise.all(tag.map(async (item) => {
            // Fetch all events
            const events = await eventModel.find({ status: "Publish", is_completed: "Upcoming", tagId: item._id }, { status: 0, is_completed: 0 }).lean()
                .populate("categoryId", "_id avatar category").populate("organizerId", "_id avatar organizer email")
                .populate("sponsorId", "_id avatar sponsor").populate("tagId", "name").limit(6)

            return {
                ...item.toObject(),
                event: events
            };
        }));

        // Cache the result
        setCachedData(cacheKey, updatedTagData);

        return res.json({ data: { success: 1, message: "Tag Found", tag: updatedTagData, error: 0 } });

    } catch (error) {
        console.log("Error during get all tag", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Get events by tagId
const getEventsByTagId = async (req, res) => {
    try {

        // Extracting data from the request body
        const tagId = req.body.tagId;

        // Mark past events as Completed
        const updatedCount = await markPastEventsAsCompleted();

        // Fetch all events
        const events = await eventModel.find({ tagId: tagId, status: "Publish", is_completed: "Upcoming", }, { status: 0, is_completed: 0 })
            .populate("categoryId", "_id avatar category").populate("organizerId", "_id avatar organizer email")
            .populate("sponsorId", "_id avatar sponsor").populate("tagId", "name");

        if (!events.length) return res.json({ data: { success: 0, message: "Events Not Found", event: events, error: 1 } });

        return res.json({ data: { success: 1, message: "Events Found", event: events, error: 0 } });

    } catch (error) {
        console.log("Error during get events by tagId", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
};

// get all coupon
const getAllCoupon = async (req, res) => {
    try {

        const currentDate = new Date().toISOString().split('T')[0];

        // fetch all coupon
        const coupon = await couponModel.find({ status: "Publish", expiry_date: { $gte: currentDate } }, { status: 0 });

        if (!coupon.length) {

            return res.json({ data: { success: 0, message: "No coupons found.", coupon: coupon, error: 1 } });

        } else {

            return res.json({ data: { success: 1, message: "Coupons retrieved successfully.", coupon: coupon, error: 0 } });
        }

    } catch (error) {
        console.error("Error during get all coupon:", error.message);
        return res.json({ data: { success: 0, message: "An error occurred while retrieving completed orders.", error: 1 } });
    }
}

// check coupon
const checkCoupon = async (req, res) => {

    try {

        // Extract data from the request body
        const userId = req.user;
        const couponId = req.body.couponId;

        // Fetch the coupon from the database
        const coupon = await couponModel.findOne({ _id: couponId });

        if (!coupon) return res.json({ data: { success: 0, message: "No coupons found.", error: 1 } });

        // Get the current date
        const currentDate = moment();

        // Convert the coupon expiry_date to a Moment object
        const couponExpiryDate = moment(coupon.expiry_date);

        if (!couponExpiryDate.isAfter(currentDate)) {
            return res.json({ data: { success: 0, message: "The coupon has expired.", error: 1 } });
        }

        // Fetch orders associated with the user and coupon
        const tickets = await ticketModel.find({ userId: userId, coupon_code: coupon.code });

        if (tickets.length >= coupon.usage_limit) {
            return res.json({ data: { success: 0, message: "The coupon has reached its usage limit and can no longer be used.", error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Coupon is valid and can be used.", error: 0 } });

    } catch (error) {
        console.error("Error during check coupon:", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Function to generate the next ticket number with a given prefix.
function generateNextTicketNumber(currentId) {

    const padding = 3;
    const prefix = 'TKT-';

    // Ensure currentId is a string and starts with the expected prefix
    if (!currentId.startsWith(prefix)) {
        throw new Error('Invalid currentId. It must start with the correct prefix.');
    }

    // Extract numeric part by removing the prefix
    const numericPart = currentId.slice(prefix.length);

    // Convert numeric part to an integer
    const idNumber = parseInt(numericPart, 10);

    // Check for NaN to handle invalid inputs
    if (isNaN(idNumber)) {
        throw new Error('Invalid numeric part in currentId. It must be a numeric string.');
    }

    // Increment the ID
    const newIdNumber = idNumber + 1;

    // Convert back to string and pad with leading zeros
    const newNumericPart = String(newIdNumber).padStart(padding, '0');

    // Concatenate prefix and numeric part to create the new ticket number
    const newTicketNumber = `${prefix}${newNumericPart}`;

    return newTicketNumber;
}

// book ticket
const bookticket = async (req, res) => {

    try {

        // Extract data from the request body
        const userId = req.user;
        const eventId = req.body.eventId;
        const total_ticket = req.body.total_ticket;
        const price = req.body.price;
        const subtotal = req.body.subtotal;
        const coupon_code = req.body.coupon_code || null;
        const coupon_amount = req.body.coupon_amount || 0;
        const tax = req.body.tax || 0;
        const tax_amount = req.body.tax_amount || 0;
        const total_amount = req.body.total_amount;
        const payment_method = req.body.payment_method;
        const payment_status = req.body.payment_status;
        const transaction_id = req.body.transaction_id;
        const total_remaining_ticket = total_ticket;
        const total_remaining_tickets_to_scan = total_ticket;

        // Check for failed payment status
        if (payment_status === "Failed")
            return res.status(400).json({ data: { success: 0, message: "Your payment failed. The seat could not be booked. Please try again.", error: 1 } });

        // fetch services
        const event = await eventModel.findOne({ _id: eventId });

        if (!event) return res.json({ data: { success: 0, message: "Event Not Found", error: 1 } });

        // Get the current date and check if booking is possible
        const currentDate = moment();
        const startDate = moment(event.lastdate);

        if (currentDate.isAfter(startDate, 'day')) {
            return res.json({ data: { success: 0, message: "Oops! The booking deadline for this event has passed. Please check back for future events. ", error: 1 } });
        }

        const totalBookedTicket = event.totalBookedTicket + total_ticket;
        const availableticket = event.availableticket - total_ticket;

        // Check if the event is fully booked
        if (totalBookedTicket > event.totalSeat) {
            return res.json({ data: { success: 0, message: `We're sorry, but this event is fully booked with a maximum capacity of ${event.totalSeat} participants. Please choose another event or check back later for availability.`, error: 1 } });
        }

        // Generate the next ticket number
        const lastTicketNumber = await ticketModel.findOne().sort({ createdAt: -1 });
        const newTicketNumber = lastTicketNumber && lastTicketNumber.ticket_number ? generateNextTicketNumber(lastTicketNumber.ticket_number) : 'TKT-101';

        // save ticket
        const saveTicket = await new ticketModel(
            {
                bookeddate: currentDate.format("YYYY-MM-DD"), userId, ticket_number: newTicketNumber, eventId, total_ticket, price, subtotal,
                coupon_code, coupon_amount, tax, tax_amount, total_amount, payment_method, payment_status, transaction_id,
                total_remaining_ticket, total_remaining_tickets_to_scan
            }
        ).save();

        if (!saveTicket) return res.json({ data: { success: 0, messgae: "Unable to process your booking at this time. Please try again later...", error: 1 } })

        // update event seat
        const updatedEvent = await eventModel.updateOne({ _id: eventId }, { $set: { totalBookedTicket, availableticket } }, { new: true })

        // notification message
        const notificationHeading = "New Ticket Alert"
        const notificationMessage = `A new ticket ${newTicketNumber} has been booked for the event ${event.event}. Please review the booking details.`

        // send notification for admin
        await sendAdminNotification(notificationHeading, notificationMessage);

        // Clear all cache
        await clearAllCache();

        return res.status(200).json({ data: { success: 1, message: "Ticket has been successfully booked", error: 0 } });

    } catch (error) {
        console.log("Error during book ticket", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
};

// all booked ticket
const allbookedticket = async (req, res) => {

    try {

        let userId = req.user;

        const tickets = await ticketModel.find({ userId: userId }).populate({
            path: "eventId",
            select: "avatar event date time address totalSeat",
            populate: [
                { path: "categoryId", select: "_id category" },
                { path: "organizerId", select: "_id avatar organizer email" },
                { path: "sponsorId", select: "_id avatar sponsor" }
            ]
        });

        // change ticket status
        const updatedTickets = await changeTicketStatus(tickets);

        if (!tickets.length) return res.json({ data: { success: 0, message: "Ticket Not Found", ticket: updatedTickets, error: 1 } });

        return res.json({ data: { success: 1, message: "Ticket Found", ticket: updatedTickets, error: 0 } });

    } catch (error) {
        console.log("Error during all booked ticket", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// upcoming ticket
const upcomingticket = async (req, res) => {

    try {

        const userId = req.user
        const tickets = await ticketModel.find({ userId: userId, status: "Upcoming" }).populate({
            path: "eventId",
            select: "avatar event date time address totalSeat",
            populate: [
                { path: "categoryId", select: "_id category" },
                { path: "organizerId", select: "_id avatar organizer email" },
                { path: "sponsorId", select: "_id avatar sponsor" }
            ]
        });

        // change ticket status
        const updatedTickets = await changeTicketStatus(tickets);

        if (!tickets.length) return res.json({ data: { success: 0, message: "Ticket Not Found", ticket: updatedTickets, error: 1 } });

        return res.json({ data: { success: 1, message: "Ticket Found", ticket: updatedTickets, error: 0 } });

    } catch (error) {
        console.log("Error during upcoming ticket", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// gel all past booked ticket
const pastbookedticket = async (req, res) => {

    try {

        const userId = req.user
        const tickets = await ticketModel.find({ userId: userId, status: "Past" }).populate({
            path: "eventId",
            select: "avatar event date time address totalSeat",
            populate: [
                { path: "categoryId", select: "_id category" },
                { path: "organizerId", select: "_id avatar organizer email" },
                { path: "sponsorId", select: "_id avatar sponsor" }
            ]
        });

        // change ticket status
        const updatedTickets = await changeTicketStatus(tickets);

        if (!tickets.length) return res.json({ data: { success: 0, message: "Ticket Not Found", ticket: updatedTickets, error: 1 } });

        return res.json({ data: { success: 1, message: "Ticket Found", ticket: updatedTickets, error: 0 } });

    } catch (error) {
        console.log("Error during past booked ticket", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// cancel ticket
const cancelTicket = async (req, res) => {

    try {

        // Extract data from the request body
        const userId = req.user;
        const ticketId = req.body.ticketId;
        const total_cancel_ticket = req.body.total_cancel_ticket;
        const cancel_reason = req.body.cancel_reason;

        // fetch ticket
        const ticket = await ticketModel.findOne({ _id: ticketId }).populate("userId eventId");

        if (!ticket) return res.status(404).json({ data: { success: 0, message: "Ticket not found.", error: 1 } });

        // Get the current date and check if booking is possible
        const currentDate = moment();
        const startDate = moment(ticket.eventId.lastdate);

        if (currentDate.isAfter(startDate, 'day')) {
            return res.json({ data: { success: 0, message: "Sorry! The cancellation period for this event has ended, and your ticket cannot be cancelled.", error: 1 } });
        }

        // Calculate new total canceled tickets
        const previousCanceled = ticket.cancellation_info.reduce((total, info) => total + info.total_cancel_ticket, 0);
        const newTotalCancelTicket = previousCanceled + total_cancel_ticket;

        if (newTotalCancelTicket > ticket.total_ticket) {
            return res.status(400).json({ data: { success: 0, message: `You have already cancelled ${previousCanceled} ticket. You cannot cancel more than ${ticket.total_ticket} ticket in total. You can cancel up to ${ticket.total_ticket - previousCanceled} more ticket.`, error: 1 } });
        }

        const totalBookedTicket = ticket.eventId.totalBookedTicket - total_cancel_ticket;
        const availableticket = ticket.eventId.availableticket + total_cancel_ticket;
        const total_cancelled_ticket = ticket.total_cancelled_ticket + total_cancel_ticket;
        const total_remaining_ticket = ticket.total_ticket - (previousCanceled + total_cancel_ticket);
        const total_remaining_tickets_to_scan = total_remaining_ticket;
        // Prepare cancellation information
        const cancellation_info = {
            cancel_date: currentDate.format("YYYY-MM-DD"),
            total_cancel_ticket: total_cancel_ticket,
            cancel_reason: cancel_reason
        };

        // updated ticket
        const updatedTicket = await ticketModel.findByIdAndUpdate(
            ticketId,
            {
                $push: { cancellation_info: cancellation_info },
                $set: { total_remaining_ticket, total_cancelled_ticket, total_remaining_tickets_to_scan }
            },
            { new: true, upsert: true }
        );

        // update event seat
        const updatedEvent = await eventModel.updateOne({ _id: ticket.eventId._id }, { $set: { totalBookedTicket, availableticket } }, { new: true })

        // notification message
        const notificationHeading = "Ticket Cancelled by User"
        const notificationMessage = `The booking for the event ${ticket.eventId.event} with ticket number ${updatedTicket.ticket_number} has been cancelled by ${ticket.userId.name}.`

        // send notification for admin
        await sendAdminNotification(notificationHeading, notificationMessage);

        // Clear all cache
        await clearAllCache();

        return res.status(200).json({ data: { success: 1, message: "Ticket has been successfully canceled.", error: 0 } });

    } catch (error) {
        console.log("Error during cancel ticket", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// add favourite event
const addFavouriteEvent = async (req, res) => {

    try {

        // Extract data from the request
        const userId = req.user;
        const eventId = req.body.eventId;

        if (!eventId) return res.status(400).json({ data: { success: 0, message: "Event is required.", error: 1 } });

        // fetch all event
        const favoriteEvent = await favouriteEventModel.findOne({ userId: userId, eventId: eventId });

        if (!favoriteEvent) {
            // save favourite event
            const savefavoriteEvent = await new favouriteEventModel({ userId, eventId }).save();

            return res.json({ data: { success: 1, message: "Event successfully added to favorites.", error: 0 } })
        }
        else {

            return res.json({ data: { success: 0, message: "Event has already been added to favorites.", error: 1 } })
        }

    } catch (error) {
        console.log("Error during add favourite event", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
};

// Get all favourite events
const getAllFavouriteEvent = async (req, res) => {

    try {

        // Extract data from authentication
        const userId = req.user;

        // Fetch all user favourite events
        const favouriteEvents = await favouriteEventModel.find({ userId: userId }).select('eventId -_id');

        const favouriteEventIds = favouriteEvents.map(fe => fe.eventId);

        // Fetch events
        const fetchedEventData = await eventModel.find({ _id: { $in: favouriteEventIds } }, { status: 0 });

        if (!fetchedEventData.length) {

            return res.json({ data: { success: 0, message: "Events Not Found", event: fetchedEventData, error: 1 } });

        } else {
            return res.json({ data: { success: 1, message: "Events Found", event: fetchedEventData, error: 0 } });
        }

    } catch (error) {
        console.log("Error during fetching favourite events", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// delete favourite event
const deleteFavouriteEvent = async (req, res) => {

    try {

        // Extract data from the request
        const userId = req.user;
        const eventId = req.body.eventId;

        // Delete favourite event
        const deleteFavouriteEvent = await favouriteEventModel.deleteOne({ userId: userId, eventId: eventId });

        return res.json({ data: { success: 1, message: "Favorite event successfully deleted.", error: 0 } });

    } catch (error) {
        console.log("Error during delete favourite event", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all notification
const getAllNotification = async (req, res) => {

    try {

        // Extract data from the request body
        const userId = req.user;

        // Fetch all notifications for the user
        const notifications = await notificationModel.find(
            { $or: [{ recipient_user: userId }, { recipient: "User" }] },
            { recipient_user: 0, recipient: 0, is_read: 0 }
        ).sort({ createdAt: -1 });

        if (!notifications.length) {

            return res.json({ data: { success: 0, message: "Notification Not Found", notification: notifications, error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Notification Found", notification: notifications, error: 0 } });
        }

    } catch (error) {
        console.log("Error during get all notification :", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get page
const getpage = async (req, res) => {

    try {

        const pages = await pageModel.findOne();

        if (!pages) {

            return res.json({ data: { success: 0, message: "Page Not Found", page: pages, error: 1 } });
        }
        else {
            return res.json({ data: { success: 1, message: "Page Found", page: pages, error: 0 } });
        }

    } catch (error) {
        console.log("Error during get page:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

//get currency &time zone
const getcurrencytimezone = async (req, res) => {

    try {

        // fetch currency
        const currency = await currencyTimezoneModel.findOne();

        if (!currency) {

            return res.json({ data: { success: 0, message: "Currency Not Found", currency: {}, error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Currency Found", currency: currency, error: 0 } })
        }

    } catch (error) {
        console.log("Error during get currency :", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occured", error: 1 } });
    }
}

// get all payment gateway
const paymentgateway = async (req, res) => {

    try {

        // fetch all payment gateway
        const paymentGatewayConfig = await paymentGatewayModel.findOne();

        if (!paymentGatewayConfig) {

            return res.json({ data: { success: 0, message: "Payment Gateway Not Found", paymentGateway: {}, error: 1 } });
        } else {

            // Payment gateway configuration found
            const paymentData = {

                "stripe": {
                    "stripe_is_enable": paymentGatewayConfig.stripe_is_enable,
                    "stripe_mode": paymentGatewayConfig.stripe_mode,
                    "stripe_publishable_key": paymentGatewayConfig.stripe_mode === "testMode" ? paymentGatewayConfig.stripe_test_mode_publishable_key : paymentGatewayConfig.stripe_live_mode_publishable_key,
                    "stripe_secret_key": paymentGatewayConfig.stripe_mode === "testMode" ? paymentGatewayConfig.stripe_test_mode_secret_key : paymentGatewayConfig.stripe_live_mode_publishable_key
                },
                "razorpay": {
                    "razorpay_is_enable": paymentGatewayConfig.razorpay_is_enable,
                    "razorpay_mode": paymentGatewayConfig.razorpay_mode,
                    "razorpay_key_id": paymentGatewayConfig.razorpay_mode === "testMode" ? paymentGatewayConfig.razorpay_test_mode_key_id : paymentGatewayConfig.razorpay_live_mode_key_id,
                    "razorpay_key_secret": paymentGatewayConfig.razorpay_mode === "testMode" ? paymentGatewayConfig.razorpay_test_mode_key_secret : paymentGatewayConfig.razorpay_live_mode_key_secret
                },
                "paypal": {
                    "paypal_is_enable": paymentGatewayConfig.paypal_is_enable,
                    "paypal_mode": paymentGatewayConfig.paypal_mode,
                    "paypal_merchant_id": paymentGatewayConfig.paypal_mode === "testMode" ? paymentGatewayConfig.paypal_test_mode_merchant_id : paymentGatewayConfig.paypal_live_mode_merchant_id,
                    "paypal_tokenization_key": paymentGatewayConfig.paypal_mode === "testMode" ? paymentGatewayConfig.paypal_test_mode_tokenization_key : paymentGatewayConfig.paypal_live_mode_tokenization_key,
                    "paypal_public_key": paymentGatewayConfig.paypal_mode === "testMode" ? paymentGatewayConfig.paypal_test_mode_public_key : paymentGatewayConfig.paypal_live_mode_public_key,
                    "paypal_private_key": paymentGatewayConfig.paypal_mode === "testMode" ? paymentGatewayConfig.paypal_test_mode_private_key : paymentGatewayConfig.paypal_live_mode_private_key
                }
            };

            return res.json({ data: { success: 1, message: "Payment Gateway Found", paymentGateway: paymentData, error: 0 } });
        }

    } catch (error) {
        console.log("Error during get all payment gateway", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occured", error: 1 } });
    }
}

// get otp 
const getotp = async (req, res) => {

    try {


        // Extract data from the request body
        const { email } = req.body;

        // Fetch OTP
        const otp = await otpModel.findOne({ email });

        if (!otp) {
            return res.json({ data: { success: 0, message: "OTP not found", otp, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "OTP found", otp, error: 0 } });

    } catch (error) {
        console.log("Error during get otp", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get forgot password otp
const getforgotpasswordotp = async (req, res) => {

    try {

        // Extract data from the request body
        const { email } = req.body;

        // Fetch OTP
        const otp = await forgotPassowrdOtpModel.findOne({ email });

        if (!otp) {
            return res.json({ data: { success: 0, message: "OTP not found", otp, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "OTP found", otp, error: 0 } });

    } catch (error) {
        console.log("Error during get forgot password otp", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

module.exports = {

    checkregisteruser,
    signup,
    verifyotp,
    interestedCategory,
    signin,
    isverifyaccount,
    resendotp,
    forgotpassword,
    forgotpasswordotpverification,
    resetpassword,
    getuser,
    uploadimage,
    useredit,
    changepassword,
    deleteaccountuser,
    splash,
    allcategory,
    organizer,
    sponsor,
    eventdetails,
    search,
    getAllTag,
    getEventsByTagId,
    getAllCoupon,
    checkCoupon,
    bookticket,
    allbookedticket,
    upcomingticket,
    pastbookedticket,
    cancelTicket,
    addFavouriteEvent,
    getAllFavouriteEvent,
    deleteFavouriteEvent,
    getAllNotification,
    getpage,
    getcurrencytimezone,
    paymentgateway,
    getotp,
    getforgotpasswordotp

}