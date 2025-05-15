const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

    avatar: {
        type: String,
        required: true
    },
    category: {
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
    }
);

const category = mongoose.model('category', categorySchema);

module.exports = category;