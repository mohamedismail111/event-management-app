// Importing required modules 
const moment = require('moment');

// Importing models
const eventModel = require("../models/eventModel");

// Importing the cache function
const { getCachedData, setCachedData, clearAllCache } = require("./cache");

async function markPastEventsAsCompleted() {

    try {

        const currentDate = moment().startOf('day').format('YYYY-MM-DD');

        // Bulk update: Set 'is_completed' to 'Completed' for past events not already completed
        const updateResult = await eventModel.updateMany(
            {
                date: { $lt: currentDate },
                is_completed: { $ne: 'Completed' }
            },
            { $set: { is_completed: 'Completed' } }
        );

        if (updateResult.modifiedCount > 0) {
            clearAllCache();
        }

        return

    } catch (error) {
        console.error("Error updating past events to 'Completed':", error);
        throw error;
    }
}

module.exports = {
    markPastEventsAsCompleted
};
