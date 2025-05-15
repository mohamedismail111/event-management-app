const mongoose = require('mongoose');

const currencyTimezoneSchema = mongoose.Schema({

    currency: {
        type: String,
        required: true,
        trim: true
    },
    timezone: {
        type: String,
        required: true,
        trim: true
    }
    
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('currencyTimezone', currencyTimezoneSchema);