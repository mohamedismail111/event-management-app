// Importing required modules 
const express = require("express");

// Create an instance of the express router
const routes = express.Router();

// Importing middleware functions for check user authentication
const { checkAuthenticationForAdmin } = require("../middleware/checkAuthentication");

// Import controllers
const adminApiController = require("../controllers/adminApiController");

// Routes For Login
routes.post("/login", adminApiController.login);

routes.post("/myticket", checkAuthenticationForAdmin, adminApiController.myticket);

module.exports = routes;