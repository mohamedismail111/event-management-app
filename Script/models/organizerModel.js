const mongoose = require('mongoose');

const OrganizerSchema = new mongoose.Schema({

    avatar: {
        type: String,
        required: true,
        trim: true
    },
    organizer: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
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

const organizer = mongoose.model('organizer', OrganizerSchema);

module.exports = organizer;