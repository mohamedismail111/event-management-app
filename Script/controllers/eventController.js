// Importing required modules 

// Importing models
const loginModel = require("../models/adminLoginModel");
const categoryModel = require("../models/categoryModel");
const sponsorModel = require("../models/sponsorModel");
const organizerModel = require("../models/organizerModel");
const eventModel = require("../models/eventModel");
const tagModel = require("../models/tagModel");
const favouriteEventModel = require("../models/favouriteEventModel");
const ticketModel = require("../models/ticketModel");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

// Importing the service function to change event completed status
const { markPastEventsAsCompleted } = require("../services/markPastEventsAsCompleted");

// Importing the cache function
const { clearAllCache } = require("../services/cache");

// Load and render the view for add event
const loadAddEvent = async (req, res) => {

    try {

        // fetch all category
        const category = await categoryModel.find({ status: "Publish" });

        // fetch all organizer
        const organizer = await organizerModel.find({ status: "Publish" });

        // fetch all sponsor
        const sponsor = await sponsorModel.find({ status: "Publish" });

        // fetch all tag
        const tag = await tagModel.find();

        return res.render("addEvent", { category, organizer, sponsor, tag });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'add-event');
    }
}

// Add event
const addEvent = async (req, res) => {

    try {

        const loginData = await loginModel.findById(req.session.adminId);

        if (loginData && loginData.is_admin === 0) {
            // Delete the uploaded image
            if (req.files && req.files['image'] && req.files['image'][0]) {
                const imageFilename = req.files['image'][0].filename;
                deleteImages(imageFilename);
            }

            // Delete images in the gallery if any
            if (req.files && req.files['gallery']) {
                const galleryImages = req.files['gallery'].map(file => file.filename);
                for (const galleryImage of galleryImages) {
                    deleteImages(galleryImage);
                }
            }

            req.flash('error', 'You do not have permission to add event. As a demo admin, you can only view the content.');
            return res.redirect(process.env.BASE_URL + 'gallery');
        }

        // check if the last date is before the start date
        if (req.body.lastdate > req.body.date) {
            // Delete the uploaded image
            if (req.files && req.files['image'] && req.files['image'][0]) {
                const imageFilename = req.files['image'][0].filename;
                deleteImages(imageFilename);
            }

            // Delete images in the gallery if any
            if (req.files && req.files['gallery']) {
                const galleryImages = req.files['gallery'].map(file => file.filename);
                for (const galleryImage of galleryImages) {
                    deleteImages(galleryImage);
                }
            }
            req.flash('error', 'Please ensure that the booking last date is not later than the start date.');
            return res.redirect(process.env.BASE_URL + 'add-event');
        }

        // Extract data from the request body one by one
        const name = req.body.name;
        const categoryId = req.body.categoryId;
        const organizerId = req.body.organizerId;
        const sponsorId = req.body.sponsorId;
        const date = req.body.date;
        const time = req.body.time;
        const lastdate = req.body.lastdate;
        const price = req.body.price;
        const tagId = req.body.tagId;
        const totalSeat = req.body.totalSeat;
        const tax = req.body.tax;
        const address = req.body.address;
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const photo_link = req.body.photo_link;
        const briefdescription = req.body.briefdescription.replace(/"/g, '&quot;');
        const disclaimer = req.body.disclaimer.replace(/"/g, '&quot;');
        const description = req.body.description.replace(/"/g, '&quot;');
        const availableticket = totalSeat;
        // Extract file information from req.files
        const image = req.files['image'] ? req.files['image'][0].filename : null;
        const gallery = req.files['gallery'] ? req.files['gallery'].map(file => file.filename) : [];

        // Save event
        const newEvent = new eventModel({
            avatar: image, event: name, categoryId, organizerId, sponsorId, date, lastdate, time, price, tax, totalSeat, availableticket, photo_link,
            availableticket, address, location: { latitude, longitude }, disclaimer, description, briefdescription, galleryImg: gallery, tagId
        });

        await newEvent.save();

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'event');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'add-event');
    }
}

// Load and render the view for events
const loadEvents = async (req, res) => {

    try {

        // Mark past events as Completed
        const updatedCount = await markPastEventsAsCompleted();

        // Fetch all events
        const events = await eventModel.find({ is_completed: "Upcoming" }).populate("categoryId", "_id category")
            .populate("organizerId", "_id organizer").populate("sponsorId", "_id sponsor").populate("tagId", "name");

        // Fetch admin
        const loginData = await loginModel.find();

        return res.render("event", { events: events, IMAGE_URL: process.env.IMAGE_URL, loginData });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'event');
    }
}

// Load and render the view for edit event
const loadEditEvent = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch event using id
        const event = await eventModel.findOne({ _id: id });

        const category = await categoryModel.find({ status: "Publish" });

        // fetch all organizer
        const organizer = await organizerModel.find({ status: "Publish" });

        // fetch all sponsor
        const sponsor = await sponsorModel.find({ status: "Publish" });

        // fetch all tag
        const tag = await tagModel.find();

        return res.render("editEvent", { event, IMAGE_URL: process.env.IMAGE_URL, category, organizer, sponsor, tag });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'event');
    }
}

// Edit event
const editEvent = async (req, res) => {

    const id = req.body.id;
    const oldImage = req.body.oldImage;
    try {

        // check if the last date is before the start date
        if (req.body.lastdate > req.body.date) {
            let avatar = oldImage;
            if (req.file) {
                // Delete old image
                deleteImages(oldImage);
                avatar = req.file.filename;
            }
            req.flash('error', 'Please ensure that the booking last date is not later than the start date.');
            return res.redirect(process.env.BASE_URL + `edit-event?id=${id}`);
        }

        // Extract data from the request body
        const name = req.body.name;
        const categoryId = req.body.categoryId;
        const organizerId = req.body.organizerId;
        const sponsorId = req.body.sponsorId;
        const date = req.body.date;
        const time = req.body.time;
        const lastdate = req.body.lastdate;
        const price = req.body.price;
        const tagId = req.body.tagId;
        const tax = req.body.tax;
        const address = req.body.address;
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const photo_link = req.body.photo_link;
        const briefdescription = req.body.briefdescription.replace(/"/g, '&quot;');
        const disclaimer = req.body.disclaimer.replace(/"/g, '&quot;');
        const description = req.body.description.replace(/"/g, '&quot;');
        const totalSeat = parseInt(req.body.totalSeat, 10);
        const totalOldSeat = parseInt(req.body.totalOldSeat, 10);
        const totalBookedTicket = parseInt(req.body.totalBookedTicket, 10);

        // Check if total seat is less than the old total seat
        if (totalSeat < totalOldSeat) {
            req.flash('error', `Total seat cannot be less than the currently seat ${totalOldSeat} because it will affect the ticket booking.`);
            return res.redirect(`/edit-event?id=${id}`);
        }

        // Calculate total available ticket
        const totalAvailableTicket = totalSeat - totalBookedTicket;

        let avatar = oldImage;
        if (req.file) {
            // Delete old image
            deleteImages(oldImage);
            avatar = req.file.filename;
        }

        // Update event
        await eventModel.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    avatar, event: name, categoryId, organizerId, sponsorId, date, lastdate, time, price, tax, totalSeat, availableticket: totalAvailableTicket,
                    address, location: { latitude, longitude }, photo_link, disclaimer, description, briefdescription, tagId
                }
            },
            { new: true }
        );

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + `event-details?id=${id}`);

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + `event-details?id=${id}`);
    }
}

// Delete event
const deleteEvent = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch event using id
        const event = await eventModel.findById(id);

        // Delete image
        deleteImages(event.avatar);

        // delete gallery image
        event.galleryImg.forEach((item) => {
            deleteImages(item);
        })

        // Delete favorite events associated with the event
        await favouriteEventModel.deleteMany({ eventId: event._id });

        // Update ticket to set eventId to null in items where eventId matches
        await ticketModel.updateMany({ eventId: event._id }, { $set: { eventId: null } });

        // Delete event
        await eventModel.deleteOne({ _id: id });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'event');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'event');
    }
}

// Update event status
const updateEventStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect(process.env.BASE_URL + 'event');
        }

        // Find the current event using the ID
        const event = await eventModel.findById(id);

        // Check if event exists
        if (!event) {
            req.flash('error', 'Event not found');
            return res.redirect(process.env.BASE_URL + 'event');
        }

        // Toggle status
        const updatedEvent = await eventModel.findByIdAndUpdate(
            id,
            { status: event.status === "Publish" ? "UnPublish" : "Publish" },
            { new: true }
        );

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + 'event');

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + 'event');
    }
}

// Load and render the view for gallery
const loadGallery = async (req, res) => {

    // Extract data from the request
    const id = req.query.id;
    try {

        // fetch gallery image
        const galleryImages = await eventModel.findById(id);

        // fetch admin
        const loginData = await loginModel.find();

        return res.render("gallery", { galleryImages, loginData, IMAGE_URL: process.env.IMAGE_URL });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + `gallery?id=${id}`);
    }
}

// add image 
const addImage = async (req, res) => {
    // Extract data from the request
    const id = req.body.id;

    try {

        // Extract gallery images from request
        const galleryImage = req.files['gallery'] ? req.files['gallery'].map(file => file.filename) : [];

        // Find the existing gallery entry
        const existingGallery = await eventModel.findById(id);

        // Check if the gallery field is null and initialize it if necessary
        const gallery = existingGallery.galleryImg || [];

        // Update the gallery field with new images
        await eventModel.updateOne({ _id: id }, { $set: { galleryImg: gallery.concat(galleryImage) } });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + `gallery?id=${id}`);

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + `gallery?id=${id}`);
    }
}

// edit image
const editImage = async (req, res) => {

    // Extract data from the request body
    const id = req.body.id;
    const oldImage = req.body.oldImage;

    try {

        let galleryImg = oldImage;
        // old image delete
        if (req.file) {
            deleteImages(oldImage);
            galleryImg = req.file.filename;
        }

        // Update the gallery images 
        const updateResult = await eventModel.findOneAndUpdate(
            { _id: id, 'galleryImg': oldImage },
            { $set: { 'galleryImg.$': galleryImg } },
            { new: true }
        );

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + `gallery?id=${id}`);

    } catch (error) {
        console.error('Error in editImage:', error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect(process.env.BASE_URL + `gallery?id=${id}`);
    }
};

// delete image
const deleteGalleryImage = async (req, res) => {

    // Extract data from the request
    const id = req.query.id;
    const gallery = req.query.name;
    try {

        // Delete the old image
        deleteImages(gallery);

        // update gallery image
        await eventModel.findByIdAndUpdate({ _id: id }, { $pull: { galleryImg: { $in: [gallery] } } }, { new: true });

        // Clear all cache
        await clearAllCache();

        return res.redirect(process.env.BASE_URL + `gallery?id=${id}`);;

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + `gallery?id=${id}`);;
    }
}

// load and render the view for event details
const loadEventDetails = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch  events
        const event = await eventModel.findOne({ _id: id }).populate("categoryId", "_id category")
            .populate("organizerId", "_id organizer").populate("sponsorId", "_id sponsor").populate("tagId", "name");

        // fetch all admin
        const loginData = await loginModel.find();

        return res.render("eventDetails", { event, IMAGE_URL: process.env.IMAGE_URL, loginData });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'event');
    }
}

// fetch all completed event
const loadAllCompletedEvent = async (req, res) => {

    try {

        // Mark past events as Completed
        const updatedCount = await markPastEventsAsCompleted();

        // Fetch all  completed events 
        const completedEvents = await eventModel.find({ is_completed: 'Completed' })
            .populate("categoryId", "_id category")
            .populate("organizerId", "_id organizer")
            .populate("sponsorId", "_id sponsor")
            .populate("tagId", "name");

        return res.render("completedEvent", { events: completedEvents, IMAGE_URL: process.env.IMAGE_URL });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'event');
    }
}

// load and render the view for event details
const loadCompletedEventDetails = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Fetch  events
        const event = await eventModel.findOne({ _id: id }).populate("categoryId", "_id category")
            .populate("organizerId", "_id organizer").populate("sponsorId", "_id sponsor").populate("tagId", "name");

        return res.render("completedEventDetails", { event, IMAGE_URL: process.env.IMAGE_URL });

    } catch (error) {
        console.log(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(process.env.BASE_URL + 'event');
    }
}


module.exports = {

    loadAddEvent,
    addEvent,
    loadEvents,
    loadEditEvent,
    editEvent,
    deleteEvent,
    updateEventStatus,
    loadGallery,
    addImage,
    editImage,
    deleteGalleryImage,
    loadEventDetails,
    loadAllCompletedEvent,
    loadCompletedEventDetails

}
