// Importing required modules 

// Importing models
const loginModel = require("../models/adminLoginModel");
const sponsorModel = require("../models/sponsorModel");
const eventModel = require("../models/eventModel");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

// Importing the cache function
const { clearAllCache } = require("../services/cache");

// Add sponsor
const addSponsor = async (req, res) => {

    try {

        // Extract data from the request body
        const name = req.body.name;
        const image = req.file.filename;

        // Save sponsor
        const saveSponsor = await new sponsorModel({ sponsor: name, avatar: image }).save();

        return res.redirect(process.env.BASE_URL + 'sponsor');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'sponsor');
    }
}

// Load and render the view for sponsor
const loadSponsor = async (req, res) => {

    try {

        // Fetch all sponsors
        const sponsors = await sponsorModel.find();

        // Fetch admin
        const loginData = await loginModel.find();

        return res.render("sponsor", { sponsors, IMAGE_URL: process.env.IMAGE_URL, loginData });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'sponsor');
    }
}

// Edit sponsor
const editSponsor = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const name = req.body.name;
        const oldImage = req.body.oldImage;
        let image = oldImage;

        if (req.file) {
            // Delete old sponsor icon
            deleteImages(oldImage);
            image = req.file.filename;
        }

        // Update sponsor
        const updatedSponsor = await sponsorModel.findOneAndUpdate(
            { _id: id },
            { $set: { sponsor: name, avatar: image } },
            { new: true }
        );

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'sponsor');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'sponsor');
    }
}

// Update sponsor status
const updateSponsorStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect(process.env.BASE_URL + 'sponsor');
        }

        // Find the current sponsor using the ID
        const sponsor = await sponsorModel.findById(id);

        // Check if sponsor exists
        if (!sponsor) {
            req.flash('error', 'Sponsor not found');
            return res.redirect(process.env.BASE_URL + 'sponsor');
        }

        // Toggle status
        const updatedSponsor = await sponsorModel.findByIdAndUpdate(
            id,
            { status: sponsor.status === "Publish" ? "UnPublish" : "Publish" },
            { new: true }
        );

        return res.redirect(process.env.BASE_URL + 'sponsor');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'sponsor');
    }
}

// Delete sponsor
const deleteSponsor = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch sponsor
        const sponsor = await sponsorModel.findOne({ _id: id });

        // Delete sponsor image
        deleteImages(sponsor.avatar);

        // Remove the sponsor from the array
        await eventModel.updateMany({ sponsorId: id }, { $pull: { sponsorId: id } });

        // Delete sponsor
        const deletedSponsor = await sponsorModel.deleteOne({ _id: sponsor._id });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'sponsor');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'sponsor');
    }
}

module.exports = {

    addSponsor,
    loadSponsor,
    editSponsor,
    updateSponsorStatus,
    deleteSponsor

}
