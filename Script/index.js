// Importing required modules 
const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const path = require("path");
const MongoStore = require('connect-mongo');

// Configure dotenv
dotenv.config();

// Import database connection
require("./config/conn");

// Import flash middleware
const flashmiddleware = require('./config/flash');

// Create an instance of an Express application
const app = express();

// Configure session
app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DB_CONNECTION,
        ttl: 3600
    })
}));

// Use flash middleware
app.use(flash());
app.use(flashmiddleware.setflash);

// Configure body-parser for handling form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes for the Admin section
const adminRoutes = require("./routes/adminRoutes");
app.use(process.env.BASE_URL, adminRoutes);

// Routes for the API section
const apiRoutes = require("./routes/apiRoutes");
app.use("/api", apiRoutes);

// Routes for the Admin Api section
app.use('/admin/api', require('./routes/adminApiRoutes'));

//create server
app.listen(process.env.SERVER_PORT, () => {
    console.log("server is start :", process.env.SERVER_PORT);
})



