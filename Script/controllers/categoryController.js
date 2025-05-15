// Importing required modules 

// Importing models
const loginModel = require("../models/adminLoginModel");
const categoryModel = require("../models/categoryModel");
const ticketModel = require("../models/ticketModel");
const eventModel = require("../models/eventModel");
const userModel = require("../models/userModel");
const favouriteEventModel = require("../models/favouriteEventModel");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

// Importing the cache function
const { clearAllCache } = require("../services/cache");

// add category
const addCategory = async (req, res) => {

    try {

        // Extract data from the request body
        const name = req.body.name;
        const image = req.file.filename;

        // save category
        const saveCategory = await new categoryModel({ category: name, avatar: image }).save();

        return res.redirect(process.env.BASE_URL + 'category');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'category');
    }
}

// Load and render the view for category
const loadCategory = async (req, res) => {

    try {

        // fetch all categories
        const categories = await categoryModel.find();

        // fetch admin
        const loginData = await loginModel.find();

        return res.render("category", { categories, IMAGE_URL: process.env.IMAGE_URL, loginData });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'category');
    }

}

// edit category
const editCategory = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const name = req.body.name;
        const oldImage = req.body.oldImage;
        let image = oldImage;

        if (req.file) {
            // delete old category icon
            deleteImages(oldImage);
            image = req.file.filename;
        }

        // updated category
        const updatedCategory = await categoryModel.findOneAndUpdate({ _id: id }, { $set: { category: name, avatar: image } }, { new: true });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'category');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'category');
    }
}

// update category status
const updateCategoryStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            res.redirect(process.env.BASE_URL + 'category');
        }

        // Find the current point using the ID
        const category = await categoryModel.findById(id);

        // Check if category exists
        if (!category) {
            req.flash('error', 'Category not found');
            res.redirect(process.env.BASE_URL + 'category');
        }

        // Toggle status
        const updatedCategory = await categoryModel.findByIdAndUpdate(id, { status: category.status === "Publish" ? "UnPublish" : "Publish" }, { new: true });

        return res.redirect(process.env.BASE_URL + 'category');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'category');
    }
}

// delete category
const deleteCategory = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // fetch category
        const category = await categoryModel.findOne({ _id: id });

        // delete category image
        deleteImages(category.avatar);

        // Fetch events associated with the given category
        const events = await eventModel.find({ categoryId: category._id });

        for (const event of events) {
            // Delete event image
            deleteImages(event.avatar);

            // Delete event gallery images
            if (event.galleryImg && Array.isArray(event.galleryImg)) {
                event.galleryImg.forEach((item) => {
                    deleteImages(item);
                });
            }

            // Delete favorite events associated with the event
            await favouriteEventModel.deleteMany({ eventId: event._id });

            // Update ticket to set eventId to null in items where eventId matches
            await ticketModel.updateMany({ eventId: event._id }, { $set: { eventId: null } });

            // Delete the event
            const deletedEvent = await eventModel.deleteOne({ _id: event._id });

        }

        // Remove the user interest category from the array
        await userModel.updateMany({ interestCategoryId: category._id }, { $pull: { interestCategoryId: category._id } });

        // delete category
        const deletedCategory = await categoryModel.deleteOne({ _id: category._id });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'category');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'category');
    }
}

module.exports = {

    addCategory,
    loadCategory,
    editCategory,
    updateCategoryStatus,
    deleteCategory
}