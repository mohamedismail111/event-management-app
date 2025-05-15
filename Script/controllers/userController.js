// Importing required modules 

// Importing models
const loginModel = require("../models/adminLoginModel");
const userModel = require("../models/userModel");
const favouriteEventModel = require("../models/favouriteEventModel");
const userNotificationModel = require("../models/userNotificationModel");
const notificationModel = require("../models/notificationModel");
const ticketModel = require("../models/ticketModel");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

const loadUser = async (req, res) => {

    try {

        // fetch all user
        const user = await userModel.find();

        // fetch admin
        const loginData = await loginModel.find();

        return res.render("user", { user, loginData, IMAGE_URL: process.env.IMAGE_URL });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong while loading user details.');
        return res.redirect(process.env.BASE_URL + 'user');
    }
}

// for active user
const activeUser = async (req, res) => {

    try {

        // Extract data from the request
        const id = req.query.id;

        // Find current user
        const currentUser = await userModel.findById({ _id: id });

        const user = await userModel.findByIdAndUpdate({ _id: id }, { $set: { is_active: currentUser.is_active === false ? true : false } }, { new: true });

        return res.redirect(process.env.BASE_URL + 'user');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong while activating user.');
        return res.redirect(process.env.BASE_URL + 'user');
    }
}

// for edit user
const editUser = async (req, res) => {

    try {

        // Extract data from the request
        const id = req.body.id;
        const name = req.body.name;
        const country_code = req.body.country_code;
        const phone = req.body.phone;
        const gender = req.body.gender;

        // Update user details
        const user = await userModel.findByIdAndUpdate({ _id: id }, { $set: { name, country_code, phone, gender } }, { new: true });

        return res.redirect(process.env.BASE_URL + 'user');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong while editing user details.');
        return res.redirect(process.env.BASE_URL + 'user');
    }
}

// for delete user
const deleteUser = async (req, res) => {

    try {

         // Extract data from the request
         const userId = req.query.id;

         // fetch user
         const user = await userModel.findOne({ _id: userId });
 
         if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect(process.env.BASE_URL + 'user');
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
 
         req.flash('success', 'User deleted successfully.');
         return res.redirect(process.env.BASE_URL + 'user');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong while deleting user details.');
        return res.redirect(process.env.BASE_URL + 'user');
    }
}

module.exports = {
    loadUser,
    activeUser,
    editUser,
    deleteUser
}
