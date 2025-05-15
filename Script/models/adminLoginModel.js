const mongoose = require('mongoose');

const LoginSchema = mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
    },
    avatar: {
        type: String,
    },
    is_admin: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });

const login = mongoose.model('login', LoginSchema);
module.exports = login;