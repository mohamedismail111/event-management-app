const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({

    image: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    start_date: {
        type: String,
        required: true,
        trim: true
    },
    expiry_date: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        trim: true
    },
    min_amount: {
        type: Number,
        default: 0
    },
    discount_type: {
        type: String,
        enum: ['Percentage', 'Fixed'],
        required: true
    },
    usage_limit: {
        type: Number,
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

module.exports = mongoose.model("coupon", couponSchema);