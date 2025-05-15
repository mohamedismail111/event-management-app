// Importing required modules
const bcrypt = require("bcryptjs");

// Importing models
const loginModel = require("../models/adminLoginModel");
const organizerModel = require("../models/organizerModel");
const eventModel = require("../models/eventModel");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

// Importing the cache function
const { clearAllCache } = require("../services/cache");

// Add organizer
const addOrganizer = async (req, res) => {

    try {

        // Extract data from the request body
        const name = req.body.name;
        const image = req.file.filename;
        const email = req.body.email;
        const password = req.body.password;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save organizer
        const saveOrganizer = await new organizerModel({ organizer: name, avatar: image, email, password: hashedPassword }).save();

        return res.redirect(process.env.BASE_URL + 'organizer');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'organizer');
    }
}

// Load and render the view for organizer
const loadOrganizer = async (req, res) => {

    try {

        // Fetch all organizers
        const organizers = await organizerModel.find();

        // Fetch admin
        const loginData = await loginModel.find();

        return res.render("organizer", { organizers, IMAGE_URL: process.env.IMAGE_URL, loginData });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'organizer');
    }
}

// Edit organizer
const editOrganizer = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const name = req.body.name;
        const email = req.body.email;
        const oldImage = req.body.oldImage;
        let image = oldImage;

        if (req.file) {
            // Delete old organizer icon
            deleteImages(oldImage);
            image = req.file.filename;
        }

        // Update organizer
        const updatedOrganizer = await organizerModel.findOneAndUpdate({ _id: id }, { $set: { organizer: name, avatar: image, email } }, { new: true });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'organizer');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'organizer');
    }
}

// Update organizer status
const updateOrganizerStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect(process.env.BASE_URL + 'organizer');
        }

        // Find the current organizer using the ID
        const organizer = await organizerModel.findById(id);

        // Check if organizer exists
        if (!organizer) {
            req.flash('error', 'Organizer not found');
            return res.redirect(process.env.BASE_URL + 'organizer');
        }

        // Toggle status
        const updatedOrganizer = await organizerModel.findByIdAndUpdate(
            id,
            { status: organizer.status === "Publish" ? "UnPublish" : "Publish" },
            { new: true }
        );

        return res.redirect(process.env.BASE_URL + 'organizer');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'organizer');
    }
}

// Delete organizer
const deleteOrganizer = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch organizer
        const organizer = await organizerModel.findOne({ _id: id });

        // Delete organizer image
        deleteImages(organizer.avatar);

        // Remove the organizer from the array
        await eventModel.updateMany({ organizerId: id }, { $pull: { organizerId: id } });

        // Delete organizer
        const deletedOrganizer = await organizerModel.deleteOne({ _id: organizer._id });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'organizer');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'organizer');
    }
}

const updateOrganizerPassword = async (req, res) => {

    try {
        // Extract data from the request body
        const id = req.body.id;
        const newPassword = req.body.new_password;
        const confirmPassword = req.body.confirm_password;

        if (newPassword !== confirmPassword) {
            req.flash('error', 'New password and confirm password does not match.');
            return res.redirect(process.env.BASE_URL + 'organizer');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update organizer password
        const updatedOrganizer = await organizerModel.findByIdAndUpdate(id, { $set: { password: hashedPassword } }, { new: true });

        req.flash('success', 'Password updated successfully.');
        return res.redirect(process.env.BASE_URL + 'organizer');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'organizer');
    }
}

module.exports = {

    addOrganizer,
    loadOrganizer,
    editOrganizer,
    updateOrganizerStatus,
    deleteOrganizer,
    updateOrganizerPassword
}
