const mongoose = require('mongoose');

const InterestSchema = mongoose.Schema({

    email: {
        type: String,
        required: true
    },
    interestCategory: {
        type: Array
    }
},
    {
        timestamps: true
    }
);

const interest = mongoose.model('interest', InterestSchema);

module.exports = interest;