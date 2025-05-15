// Importing required modules 
const express = require("express");

// Create an instance of the express router
const routes = express.Router();

// Importing middleware functions for upload image
const { uploadAvatar } = require("../middleware/uploadSingleFile");

// Importing middleware functions for check user authentication
const { checkAuthentication } = require("../middleware/checkAuthentication");

// Importing middleware functions for verify key
const { verifyAccess } = require("../middleware/verificationMiddleware");

// Import controllers
const apiController = require("../controllers/apiController");

// Importing controllers
routes.use(verifyAccess);

// Routes For Sign Up
routes.post("/checkregisteruser", apiController.checkregisteruser);

routes.post("/signup", apiController.signup);

routes.post("/verifyotp", apiController.verifyotp);

routes.post("/interestedCategory", apiController.interestedCategory);

// Routes For Sign In
routes.post("/signin", apiController.signin);

routes.post("/isverifyaccount", apiController.isverifyaccount);

routes.post("/resendotp", apiController.resendotp);

// Routes For Forgot Password
routes.post("/forgotpassword", apiController.forgotpassword);

routes.post("/forgotpasswordotpverification", apiController.forgotpasswordotpverification);

routes.post("/resetpassword", apiController.resetpassword);

// // Routes For User Details
routes.post("/getuser", checkAuthentication, apiController.getuser);

routes.post("/uploadimage", uploadAvatar, apiController.uploadimage);

routes.post("/useredit", checkAuthentication, apiController.useredit);

routes.post("/changepassword", checkAuthentication, apiController.changepassword);

routes.post("/deleteaccountuser", checkAuthentication, apiController.deleteaccountuser);

// Routes For Splash Screen
routes.post("/splash", apiController.splash);

// Routes For category
routes.post("/allcategory", apiController.allcategory);

// Routes For Organizer
routes.post("/organizer", apiController.organizer);

// Routes For Sponsor
routes.post("/sponsor", apiController.sponsor);

// Routes For Event
routes.post("/eventdetails", apiController.eventdetails);

routes.post("/search", apiController.search);

routes.post("/getAllTag", apiController.getAllTag);

routes.post("/getEventsByTagId", apiController.getEventsByTagId);

// Routes For Coupon
routes.post("/getAllCoupon", apiController.getAllCoupon);

routes.post("/checkCoupon", checkAuthentication, apiController.checkCoupon);

// Routes For Ticket
routes.post("/bookticket", checkAuthentication, apiController.bookticket);

routes.post("/allbookedticket", checkAuthentication, apiController.allbookedticket);

routes.post("/upcomingticket", checkAuthentication, apiController.upcomingticket);

routes.post("/pastbookedticket", checkAuthentication, apiController.pastbookedticket);

routes.post("/cancelTicket", checkAuthentication, apiController.cancelTicket);

// Routes For Favourite Event
routes.post("/addFavouriteEvent", checkAuthentication, apiController.addFavouriteEvent);

routes.post("/getAllFavouriteEvent", checkAuthentication, apiController.getAllFavouriteEvent);

routes.post("/deleteFavouriteEvent", checkAuthentication, apiController.deleteFavouriteEvent);

// Routes For Notification
routes.post("/getAllNotification", checkAuthentication, apiController.getAllNotification);

// Routes For Payment Gateway
routes.post("/paymentgateway", apiController.paymentgateway);

// Routes For Page
routes.post("/getpage", apiController.getpage);

// Routes For Currency
routes.post("/getcurrencytimezone", apiController.getcurrencytimezone);

// Routes For temporary
routes.post("/getotp", apiController.getotp);

routes.post("/getforgotpasswordotp", apiController.getforgotpasswordotp);

module.exports = routes;