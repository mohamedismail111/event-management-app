//  Importing models
const adminLoginModel = require("../models/adminLoginModel");
const notificationModel = require("../models/notificationModel");
const currencyTimeZoneModel = require("../models/currencyTimezoneModel");
const userNotificationModel = require("../models/userNotificationModel");

// Importing the service function to send push notification
const { sendMultipleNotifications } = require("../services/sendPushNotification");

// Load view for send custom notification
const loadSendNotification = async (req, res) => {

    try {

        // fetch all sending notification
        const commonNotification = await notificationModel.find({ recipient: "User" });

        return res.render("sendNotification", { commonNotification });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'send-notification');
    }
}

// send notification
const sendNotification = async (req, res) => {

    try {

        const loginData = await adminLoginModel.findById(req.session.adminId);

        if (loginData && loginData.is_admin === 0) {

            req.flash('error', 'You have no access send notification, Only admin have access to this functionality...!!');
            return res.redirect(process.env.BASE_URL + 'send-notification');
        }

        // Extract data from the request body
        const title = req.body.title;
        const message = req.body.message.replace(/"/g, '&quot;');

        if (!title || !message) {
            req.flash('error', 'Both title and message are required.');
            return res.redirect(process.env.BASE_URL + 'send-notification');
        }

        // fetch user token
        const FindTokens = await userNotificationModel.find();
        const registrationTokens = FindTokens.map(item => item.registrationToken);

        // save notification
        const newNotification = await notificationModel({ title: title, message: message, recipient: "User" }).save();

        // send notification
        await sendMultipleNotifications(registrationTokens, title, message);

        req.flash('success', 'Notification sent successfully!');
        return res.redirect(process.env.BASE_URL + 'send-notification');

    } catch (error) {
        console.error("Error in sendNotification:", error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'send-notification');
    }
}


// Load and render the view for notification
const loadNotification = async (req, res) => {

    try {

        // fetch all notification
        const notifications = await notificationModel.find({ recipient: "Admin" }).sort({ createdAt: -1 });

        // Update the notifications to mark them as read
        notifications.forEach(async (notification) => {
            notification.is_read = true;
            await notification.save();
        });

        // fetch timezone
        const timezones = await currencyTimeZoneModel.findOne({}, { timezone: 1 })

        return res.render("notification", { notifications, timezones });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'notification');
    }
}

// get all notification
const notification = async (req, res) => {

    try {

        // fetch all latest notification
        const notifications = await notificationModel.find({ recipient: "Admin" }).sort({ createdAt: -1 }).limit(10);

        // fetch store
        const timezones = await currencyTimeZoneModel.findOne({}, { timezone: 1 })

        const result = {
            notifications: notifications,
            timezones: timezones || {}
        };

        return res.json(result);

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {
    loadNotification,
    notification,
    loadSendNotification,
    sendNotification
}