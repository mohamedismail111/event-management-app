// Importing required modules 

// Importing models
const loginModel = require("../models/adminLoginModel");
const tagModel = require("../models/tagModel");
const eventModel = require("../models/eventModel");

// Importing the cache function
const { clearAllCache } = require("../services/cache");


// Load and render the view for tag
const loadTag = async (req, res) => {

    try {

        // fetch all tags
        const tag = await tagModel.find();

        //  fetch admin
        const loginData = await loginModel.find();

        return res.render("tag", { tag, loginData });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/tag');
    }
}

// add tag
const addTag = async (req, res) => {

    try {

        // Extract data from the request body
        const name = req.body.name;

        // save tag
        const saveTag = await tagModel({ name }).save();

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'tag');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'tag');
    }
}

// edit tag
const editTag = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const name = req.body.name;

        // updated tag
        const updatedTag = await tagModel.findOneAndUpdate({ _id: id }, { $set: { name } }, { new: true });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'tag');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'tag');
    }
}

// delete tag
const deleteTag = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect(process.env.BASE_URL + 'tag');
        }

        // Remove the tag from the array
        await eventModel.updateMany({ tagId: id }, { $pull: { tags: id } });

        // Set tags field to null if empty
        await eventModel.updateMany({ tagId: id, tags: { $size: 0 } }, { $set: { tags: null } });

        // delete tag
        const deleted = await tagModel.deleteOne({ _id: id });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'tag');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'tag');
    }
}

module.exports = {

    loadTag,
    addTag,
    editTag,
    deleteTag
}