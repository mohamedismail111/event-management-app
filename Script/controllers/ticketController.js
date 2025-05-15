// Importing required modules 
const moment = require('moment');
const { URL } = require('url');

// Importing models
const loginModel = require("../models/adminLoginModel");
const ticketModel = require("../models/ticketModel");

// Importing the service function to change ticket status
const changeTicketStatus = require("../services/changeTicketStatus");

// Importing the function to send notification
const { sendUserNotification } = require("../services/sendPushNotification");

// Load and render the ticket view
const loadTicket = async (req, res) => {

    try {

        // Fetch all active tickets after updates
        const activeTickets = await ticketModel.find({ status: { $ne: 'Past' } }).populate("userId eventId").sort({ ticket_number: -1 });

        // Update ticket statuses if needed
        const updatedTickets = await changeTicketStatus(activeTickets);

        return res.render("ticket", { tickets: updatedTickets });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'ticket');
    }
}

// Load and render the view for ticket Details
const loadTicketDetails = async (req, res) => {
    // Extract ticket ID from the request query
    const ticketId = req.query.id;

    try {

        // Fetch the ticket with populated references
        const ticket = await ticketModel.findOne({ _id: ticketId })
            .sort({ bookedDate: -1 })
            .populate("userId")
            .populate({
                path: "eventId",
                populate: [
                    { path: "categoryId", select: "_id category" },
                    { path: "organizerId", select: "_id organizer" },
                    { path: "sponsorId", select: "_id sponsor" }
                ]
            });

        if (!ticket) {
            return res.status(404).send("Ticket not found");
        }

        // Get the referrer from the request headers
        const referer = req.headers.referer || '/';
        const parsedUrl = new URL(referer, `http://${req.headers.host}`);
        const previousPath = parsedUrl.pathname;

        return res.render("ticketDetails", { existingTicket: ticket, previousPath });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'ticket-details?id=' + ticketId);
    }
}

// Load and render the view for completed ticket
const loadPastTicket = async (req, res) => {

    try {

    
        // Fetch all past tickets (status 'Past')
        const pastTickets = await ticketModel.find({ status: "Past" })
            .sort({ ticket_number: -1 })
            .populate("userId eventId")
            .populate({
                path: "eventId",
                populate: [
                    { path: "categoryId", select: "_id category" },
                    { path: "organizerId", select: "_id organizer" },
                    { path: "sponsorId", select: "_id sponsor" }
                ]
            });

        // Update ticket statuses if needed (optional, since status is 'Past')
        const updatedTickets = await changeTicketStatus(pastTickets);

        return res.render("pastTicket", { tickets: updatedTickets });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'past-ticket');
    }
}

// Load and render the view for completed ticket Details
const loadCompletedTicketDetails = async (req, res) => {

    // Extract ticket ID from the request query
    const ticketId = req.query.id;
    try {

        // Fetch the ticket with populated references
        const ticket = await ticketModel.findOne({ _id: ticketId })
            .sort({ ticket_number: -1 })
            .populate("userId")
            .populate({
                path: "eventId",
                populate: [
                    { path: "categoryId", select: "_id category" },
                    { path: "organizerId", select: "_id organizer" },
                    { path: "sponsorId", select: "_id sponsor" }
                ]
            });

        return res.render("pastTicketDetails", { existingTicket: ticket });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'past-ticket-details?id=' + ticketId);
    }
}

// Load and render the view for refund
const loadRefund = async (req, res) => {

    // Extract data from the request body
    const ticketId = req.body.ticketId;
    const itemId = req.body.itemId;
    const refund_amount = req.body.refund_amount;
    const refund_notes = req.body.refund_notes;

    try {

        // update ticket
        const ticket = await ticketModel.findOneAndUpdate(
            { _id: ticketId, 'cancellation_info._id': itemId },
            {
                $set: {
                    'cancellation_info.$.refund_amount': refund_amount,
                    'cancellation_info.$.refund_notes': refund_notes
                }
            },
            { new: true } // Return the updated document
        ).populate("userId eventId");

        // Generate notification messages
        const notificationHeading = "Refund Confirmation"
        const notificationMessage = `Hello ${ticket.userId.name}, ${refund_notes}`

        // Send notification to the user
        await sendUserNotification(ticket, notificationHeading, notificationMessage);

        req.flash('success', 'Refund details updated successfully.');
        return res.redirect(process.env.BASE_URL + `ticket-details?id=${ticketId}`);

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + `ticket-details?id=${ticketId}`);
    }
}

module.exports = {
    loadTicket,
    loadTicketDetails,
    loadPastTicket,
    loadCompletedTicketDetails,
    loadRefund
}