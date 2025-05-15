const mongoose = require('mongoose');

const SplashSchema = new mongoose.Schema({

    avatar: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    splash: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    status: {
        type: String,
        enum: ["Publish", "UnPublish"],
        default: "Publish",
        trim: true
    }

},
    {
        timestamps: true
    }
);

const splash = mongoose.model('splash', SplashSchema);

module.exports = splash;