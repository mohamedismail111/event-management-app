// Importing required modules 
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");

// Importing models
const loginModel = require("../models/adminLoginModel");
const organizerModel = require("../models/organizerModel");
const ticketModel = require("../models/ticketModel");

// admin login
const login = async (req, res) => {
    // Get the configstore instance
    try {

        // Extract data from the request body
        const email = req.body.email;
        const password = req.body.password;

        // Validate email and password
        if (!email || !password) {
            return res.json({ data: { success: 0, message: "Email and password is required", error: 1 } });
        }

        const isExistEmail = await organizerModel.findOne({ email: email });

        if (!isExistEmail) return res.json({ data: { success: 0, message: "We're sorry, something went wrong when attempting to sign in.", error: 1 } });

        // compare password
        const passwordMatch = await bcrypt.compare(password, isExistEmail.password);

        if (!passwordMatch) return res.json({ data: { success: 0, message: "We're sorry, something went wrong when attempting to sign in.", error: 1 } });

        if (isExistEmail.status === "UnPublish") return res.json({ data: { success: 0, message: "Your account is currently inactive. Please reach out to the administrator for assistance.", error: 1 } });

        // generate token
        const token = jwt.sign({ id: isExistEmail._id, email: isExistEmail.email }, process.env.JWT_SECRET_KEY);

        const filteredOrganizer = {
            _id: isExistEmail._id,
            organizer: isExistEmail.organizer,
            avatar: isExistEmail.avatar,
            email: isExistEmail.email
        }

        return res.json({ data: { success: 1, message: "Logged in successfully.", token, organizer: filteredOrganizer, error: 0 } });

    } catch (error) {
        console.log("Error during admin sign in", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// verify ticket
const myticket = async (req, res) => {

    try {

        // Extract data from the request body
        const organizerId = req.organizer;
        const ticketId = req.body.ticketId;
        const total_scan_ticket = req.body.total_scan_ticket;

        // fetch ticket
        const ticket = await ticketModel.findOne({ _id: ticketId }).populate({ path: "eventId" });

        if (!ticket) return res.json({ success: 0, message: "Ticket Not Found", error: 1 });

        // Check if the organizerId exists in the array of organizerIds
        const isAuthorizedOrganizer = ticket.eventId.organizerId.some(organizer => organizer._id.toString() === organizerId.toString());

        if (!isAuthorizedOrganizer) {
            return res.json({ data: { success: 0, message: "Unauthorized access: Only the event organizer is allowed to verify tickets", error: 1 } });
        }


        const total_remaining_tickets = ticket.total_remaining_ticket;
        const previous_total_scan_ticket = ticket.total_scanned_tickets;
        const new_total_scan_ticket = previous_total_scan_ticket + total_scan_ticket;
        const total_remaining_tickets_to_scan = ticket.total_remaining_tickets_to_scan - total_scan_ticket;

        if (previous_total_scan_ticket === total_remaining_tickets) {
            return res.json({ data: { success: 0, message: "All tickets have been scanned", error: 1 } });
        }

        if (new_total_scan_ticket > total_remaining_tickets) {
            const remaining_scannable = total_remaining_tickets - previous_total_scan_ticket;
            return res.json({ data: { success: 0, message: `You have already scanned ${previous_total_scan_ticket} tickets. You can only scan up to ${remaining_scannable} more tickets.`, error: 1 } });
        }

        const updatedTicket = await ticketModel.findByIdAndUpdate(ticketId, { $set: { total_scanned_tickets: new_total_scan_ticket, total_remaining_tickets_to_scan } }, { new: true });

        return res.json({ data: { success: 1, message: "Ticket Successfully Scanned !!", error: 0 } });

    } catch (error) {
        console.log("Error during scan ticket", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

module.exports = {
    login,
    myticket
}