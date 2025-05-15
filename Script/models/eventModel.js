const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({

    avatar: {
        type: String,
        required: true,
        trim: true
    },
    event: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    organizerId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizer'
    }],
    sponsorId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sponsor'
    }],
    date: {
        type: String,
        required: true,
        trim: true
    },
    time: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    tax: {
        type: Number,
        required: true,
        trim: true
    },
    galleryImg: [{
        type: String,
        trim: true
    }],
    photo_link: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        latitude: {
            type: Number,
            required: true,
            trim: true
        },
        longitude: {
            type: Number,
            required: true,
            trim: true
        }
    },
    tagId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "tags",
        trim: true
    }],
    lastdate: {
        type: String,
        required: true,
        trim: true
    },
    totalSeat: {
        type: Number,
        required: true,
        trim: true
    },
    totalBookedTicket: {
        type: Number,
        trim: true,
        default: 0,
    },
    availableticket: {
        type: Number,
        trim: true
    },
    briefdescription: {
        type: String,
        required: true,
        trim: true
    },
    disclaimer: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["Publish", "UnPublish"],
        default: "Publish",
        trim: true
    },
    is_completed: {
        type: String,
        enum: ["Upcoming", "Completed"],
        default: "Upcoming",
        trim: true
    }

},
    {
        timestamps: true
    }
);

const event = mongoose.model('event', EventSchema);

module.exports = event;