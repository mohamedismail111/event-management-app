// Importing required modules 
const moment = require('moment');

// Importing models
const ticketModel = require("../models/ticketModel");

// Importing the function to send notification
const { sendUserNotification } = require("./sendPushNotification");

async function changeTicketStatus(tickets) {

    try {

        const currentDate = moment()

        // Process all tickets concurrently
        const updatedTickets = await Promise.all(tickets.map(async (ticket) => {

            const { status, eventId } = ticket;

            // Skip if status is already 'Past'
            if (status === 'Past') {
                return ticket;
            }

            // Extract event date; ensure eventId and eventId.date exist
            const eventDate = eventId && eventId.date ? moment(eventId.date) : null;

            if (!eventDate) {
                console.warn(`Event date not found for ticket ID: ${ticket._id}`);
                return ticket;
            }

            // Determine if the event date has passed
            if (currentDate.isSameOrAfter(eventDate)) {
                const newStatus = 'Past';

                // Update ticket status 
                const updatedTicket = await ticketModel.findOneAndUpdate({ _id: ticket._id }, { status: newStatus }, { new: true }).populate("userId eventId");

                // Generate notification messages
                const notificationHeading = "Event Successfully Completed"
                const notificationMessage = `Hello ${updatedTicket.userId.name}, your booking for the event ${eventId.event} has been successfully completed. We hope you enjoyed the event and look forward to seeing you again!`

                // Send notification to the user
                await sendUserNotification(updatedTicket, notificationHeading, notificationMessage);

                return updatedTicket;
            }

            return ticket;
        }));

        return updatedTickets;

    } catch (error) {
        console.error("Error updating ticket statuses:", error);
        throw new Error("Failed to update ticket statuses.");
    }
}

module.exports = changeTicketStatus;
