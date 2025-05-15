// Importing required modules 
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

// Import models
const userModel = require("../models/userModel");
const organizerModel = require("../models/organizerModel");

// Load environment variables
require('dotenv').config();

// JWT strategy options
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET_KEY,
};

// Define the JWT strategy
passport.use('jwt', new JwtStrategy(jwtOptions, async (payload, done) => {

    try {

        // Use findOne to find a user based on the payload information
        const user = await userModel.findOne({ _id: payload.id });

        if (user) {

            return done(null, user._id);

        } else {

            // If user is not found, indicate failure
            return done(null, false, { message: 'User not found' });

        }
    } catch (error) {
        // Handle unexpected errors
        console.error('Error during authentication:', error);
        return done(error, false);
    }
}));

// Define the JWT strategy
passport.use('admin-jwt', new JwtStrategy(jwtOptions, async (payload, done) => {

    try {

        // Use findOne to find a user based on the payload information
        const organizer = await organizerModel.findOne({ _id: payload.id });

        if (organizer) {

            return done(null, organizer._id);

        } else {

            // If user is not found, indicate failure
            return done(null, false, { message: 'Organizer not found' });

        }
    } catch (error) {
        // Handle unexpected errors
        console.error('Error during authentication:', error);
        return done(error, false);
    }
}));

