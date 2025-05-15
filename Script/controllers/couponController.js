// Importing models
const loginModel = require("../models/adminLoginModel");
const couponModel = require("../models/couponModel");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

// Load and render the view for add coupon
const loadAddCoupon = async (req, res) => {

    try {

        return res.render("addCoupon");

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'coupon');
    }
}

// add coupon
const addCoupon = async (req, res) => {

    try {

        const loginData = await loginModel.findById(req.session.adminId);

        if (loginData && loginData.is_admin === 0) {
            deleteImages(req.file.filename);
            req.flash('error', 'You do not have permission to add coupon. As a demo admin, you can only view the content.');
            return res.redirect(process.env.BASE_URL + 'coupon');
        }

        if (req.body.expiry_date < req.body.start_date) {
            deleteImages(req.file.filename);
            req.flash('error', 'Expiry date must be after start date.');
            return res.redirect(process.env.BASE_URL + 'add-coupon');
        }

        // Extract data from the request body
        const image = req.file.filename;
        const name = req.body.name;
        const code = req.body.code;
        const start_date = req.body.start_date;
        const expiry_date = req.body.expiry_date;
        const amount = req.body.amount;
        const min_amount = req.body.min_amount;
        const discount_type = req.body.discount_type;
        const usage_limit = req.body.usage_limit;

        // save coupon
        const newCoupon = await new couponModel({ image, name, code, start_date, expiry_date, amount, usage_limit, discount_type, min_amount }).save();

        return res.redirect(process.env.BASE_URL + 'coupon');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'coupon');
    }
}

// Load and render the view for coupon
const loadCoupon = async (req, res) => {

    try {
        // fetch admin data
        const loginData = await loginModel.find();

        // fetch all coupon
        const coupons = await couponModel.find({ ownerId: req.session.ownerId });

        return res.render("coupon", { coupons, loginData, IMAGE_URL: process.env.IMAGE_URL });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'coupon');
    }
}

// Load and render the view for edit coupon
const loadEditCoupon = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // fetch particular coupon
        const coupon = await couponModel.findById(id);

        return res.render("editCoupon", { coupon, IMAGE_URL: process.env.IMAGE_URL });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'coupon');
    }
}

// edit coupon
const editCoupon = async (req, res) => {

    try {

        // Extract date from the request body
        const id = req.body.id;
        const name = req.body.name;
        const code = req.body.code;
        const start_date = req.body.start_date;
        const expiry_date = req.body.expiry_date;
        const amount = req.body.amount;
        const min_amount = req.body.min_amount;
        const discount_type = req.body.discount_type;
        const usage_limit = req.body.usage_limit;
        const oldImage = req.body.oldImage;

        // check if expiry date is before start date
        if (req.body.expiry_date < req.body.start_date) {
            if (req.file) {
                // Delete old image
                deleteImages(req.file.filename);
            }
            req.flash('error', 'Expiry date must be after start date.');
            return res.redirect(process.env.BASE_URL + 'edit-coupon?id=' + id);
        }

        // check if image is uploaded
        let image = oldImage;
        if (req.file) {
            // Delete old image
            deleteImages(oldImage);
            image = req.file.filename;
        }

        // update coupon
        const updatedCoupon = await couponModel.findOneAndUpdate(
            { _id: id },
            {
                $set:
                    { image, name, code, start_date, expiry_date, amount, usage_limit, discount_type, min_amount }
            },
            { new: true }
        );

        return res.redirect(process.env.BASE_URL + 'coupon');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'coupon');
    }
}

// delete coupon
const deleteCoupon = async (req, res) => {

    try {

        // Extract data from the query
        const id = req.query.id;

        // fetch particular coupon
        const coupon = await couponModel.findById(id);

        // deleted coupon
        const deletedCoupon = await couponModel.deleteOne({ _id: coupon._id });

        return res.redirect(process.env.BASE_URL + 'coupon');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'coupon');
    }
}

// update coupon status
const updateCouponStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect(process.env.BASE_URL + 'coupon');
        }

        // Find the current coupon using the ID
        const coupon = await couponModel.findById(id);

        // Check if coupon exists
        if (!coupon) {
            req.flash('error', 'Coupon not found');
            return res.redirect(process.env.BASE_URL + 'coupon');
        }

        // Toggle status
        const updatedCoupon = await couponModel.findByIdAndUpdate(
            id,
            { status: coupon.status === "Publish" ? "UnPublish" : "Publish" },
            { new: true }
        );

        req.flash('success', 'Coupon status updated successfully.');
        return res.redirect(process.env.BASE_URL + 'coupon');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'coupon');
    }
}

module.exports = {

    loadAddCoupon,
    addCoupon,
    loadCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon,
    updateCouponStatus
}

