const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema({

    key: {
        type: String,
        required: true,
    },
    base_url: {
        type: String,
        required: true,
    }
},
    {
        timestamps: true,
    }
);

const verificationModel = mongoose.model("verification", verificationSchema);

module.exports = verificationModel;

