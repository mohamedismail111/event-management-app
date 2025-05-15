// Importing required modules 

// Importing models
const loginModel = require("../models/adminLoginModel");
const splashModel = require("../models/splashModel");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

// Load and render the view for add splash
const loadAddSplash = async (req, res) => {

    try {

        return res.render("addSplash");

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'splash');
    }
}

// Add splash
const addSplash = async (req, res) => {

    try {

        const loginData = await loginModel.findById(req.session.adminId);

        if (loginData && loginData.is_admin === 0) {
            // delete upload image
            deleteImages(req.file.filename);

            req.flash('error', 'You do not have permission to add splash. As a demo admin, you can only view the content.');
            return res.redirect(process.env.BASE_URL + 'splash');
        }

        // Extract data from the request body
        const image = req.file.filename;
        const title = req.body.title;
        const description = req.body.description;

        // Save splash
        const newSplash = new splashModel({ avatar: image, splash: title, description }).save();

        return res.redirect(process.env.BASE_URL + 'splash');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'add-splash');
    }
}

// Load and render the view for splash
const loadSplash = async (req, res) => {

    try {

        // Fetch all splash
        const splash = await splashModel.find();

        // Fetch admin
        const loginData = await loginModel.find();

        return res.render("splash", { splash, IMAGE_URL: process.env.IMAGE_URL, loginData });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'splash');
    }
}

// Load and render the view for edit splash
const loadEditSplash = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch splash using id
        const splash = await splashModel.findOne({ _id: id });

        return res.render("editSplash", { splash, IMAGE_URL: process.env.IMAGE_URL });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'splash');
    }
}

// Edit splash
const editSplash = async (req, res) => {

    // Extract data from the request body
    const id = req.body.id;
    const title = req.body.title;
    const description = req.body.description;
    const oldImage = req.body.oldImage;

    try {


        let avatar = oldImage;
        if (req.file) {
            // Delete old image
            deleteImages(oldImage);
            avatar = req.file.filename;
        }

        // Update splash
        const updateSplash = await splashModel.findOneAndUpdate({ _id: id }, { $set: { avatar, splash: title, description } });

        return res.redirect(process.env.BASE_URL + 'splash');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'edit-splash?id=' + id);
    }
}

// Delete splash
const deleteSplash = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch splash using id
        const splash = await splashModel.findById(id);

        // Delete image
        deleteImages(splash.avatar);

        // Delete splash
        const deletedSplash = await splashModel.deleteOne({ _id: id });

        return res.redirect(process.env.BASE_URL + 'splash');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'splash');
    }
}

// Update splash status
const updateSplashStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect(process.env.BASE_URL + 'splash');
        }

        // Find the current splash using the ID
        const splash = await splashModel.findById(id);

        // Check if splash exists
        if (!splash) {
            req.flash('error', 'Splash not found');
            return res.redirect(process.env.BASE_URL + 'splash');
        }

        // Toggle status
        const updatedSplash = await splashModel.findByIdAndUpdate(id, { status: splash.status === "Publish" ? "UnPublish" : "Publish" }, { new: true });

        return res.redirect(process.env.BASE_URL + 'splash');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'splash');
    }
}

module.exports = {

    loadAddSplash,
    addSplash,
    loadSplash,
    loadEditSplash,
    editSplash,
    deleteSplash,
    updateSplashStatus

}
