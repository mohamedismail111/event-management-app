const mongoose = require('mongoose');

const FavoriteSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'event'
    }
},
    {
        timestamps: true
    }
);

const favorite = mongoose.model('favoriteEvent', FavoriteSchema);

module.exports = favorite;