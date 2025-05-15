// Importing Models
const loginModel = require("../models/adminLoginModel");
const pageModel = require("../models/pageModel");

// Load and render the view for private policy
const loadPrivatePolicy = async (req, res) => {

    try {

        // check if the user is verified
        const currentUrl = req.protocol + '://' + req.get('host') + process.env.BASE_URL;
        const verifyData = await checkVerify(currentUrl);

        if (verifyData === 0) { clearConfigData(); }

        // fetch private policy
        const privatePolicy = await pageModel.findOne();

        return res.render("privatePolicy", { privatePolicy });

    } catch (error) {
        console.log(error.message);
    }
}

// add private policy
const addPrivatePolicy = async (req, res) => {

    try {

        const loginData = await loginModel.findById(req.session.adminId);

        if (loginData && loginData.is_admin === 0) {

            req.flash('error', 'You do not have permission to change private policy. As a demo admin, you can only view the content.');
            return res.redirect(process.env.BASE_URL + 'private-policy');
        }

        // Extract data from the request body
        const private_policy = req.body.private_policy.replace(/"/g, '&quot;');;

        // Fetch existing privacy policy
        let existingPolicy = await pageModel.findOne();

        if (!existingPolicy) {
            // Create a new privacy policy if none exists
            await new pageModel({ private_policy }).save();
            req.flash('success', 'Privacy policy added successfully.');
        } else {
            // Update existing privacy policy
            await pageModel.findByIdAndUpdate(existingPolicy._id, { $set: { private_policy } }, { new: true });
            req.flash('success', 'Privacy policy updated successfully.');
        }

        return res.redirect(process.env.BASE_URL + 'private-policy');

    } catch (error) {
        console.log(error.message);
    }
}

// Load and render the view for terms and condition
const loadTermsAndCondition = async (req, res) => {

    try {

        // fetch terms and condition
        const termsAndCondition = await pageModel.findOne();

        return res.render("termsAndCondition", { termsAndCondition });

    } catch (error) {
        console.log(error.message);
    }
}

// add terms and condition
const addTermsAndCondition = async (req, res) => {

    try {

        const loginData = await loginModel.findById(req.session.adminId);

        if (loginData && loginData.is_admin === 0) {

            req.flash('error', 'You do not have permission to change terms and conditions. As a demo admin, you can only view the content.');
            return res.redirect(process.env.BASE_URL + 'terms-and-condition');
        }

        // Extract data from the request body
        const terms_and_condition = req.body.terms_and_condition.replace(/"/g, '&quot;');

        // Fetch existing terms and conditions
        let termsAndCondition = await pageModel.findOne();

        if (!termsAndCondition) {
            // Create new terms and conditions if none exists
            termsAndCondition = await new pageModel({ terms_and_condition }).save();
            req.flash('success', 'Terms and conditions added successfully.');
        } else {
            // Update existing terms and conditions
            await pageModel.findOneAndUpdate({ _id: termsAndCondition._id }, { $set: { terms_and_condition } }, { new: true });
            req.flash('success', 'Terms and conditions updated successfully.');
        }

        return res.redirect(process.env.BASE_URL + 'terms-and-condition');

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {

    loadPrivatePolicy,
    addPrivatePolicy,
    loadTermsAndCondition,
    addTermsAndCondition

}