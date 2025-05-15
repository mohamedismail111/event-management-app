const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({

    avatar: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    country_code: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ["Female", "Male", "Other", "None"],
        default: "None",
        trim: true
    },
    birthdate: {
        type: String
    },
    about: {
        type: String
    },
    interestCategoryId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        trim: true
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    }
);

const user = mongoose.model('user', UserSchema);

module.exports = user;