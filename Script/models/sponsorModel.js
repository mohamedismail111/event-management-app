const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
    avatar: {
        type: String,
        required: true
    },
    sponsor: {
        type: String,
        required: true
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
});

const Sponsor = mongoose.model('sponsor', SponsorSchema);

module.exports = Sponsor;
