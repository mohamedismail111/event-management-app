const mongoose = require('mongoose');

const TicketSchema = mongoose.Schema({

    bookeddate: {
        type: String,
        required: true
    },
    ticket_number: {
        type: String,
        require: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'event'
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    total_ticket: {
        type: Number,
        require: true,
        trim: true
    },
    subtotal: {
        type: Number,
        required: true,
        trim: true
    },
    coupon_code: {
        type: String,
        require: true,
        trim: true
    },
    coupon_amount: {
        type: Number,
        required: true,
        trim: true
    },
    tax: {
        type: Number,
        required: true,
        trim: true
    },
    tax_amount: {
        type: Number,
        required: true,
        trim: true
    },
    total_amount: {
        type: Number,
        required: true,
        trim: true
    },
    payment_method: {
        type: String,
        enum: ['Cash On Delivery', 'Paypal', 'Stripe', 'Razorpay'],
        trim: true
    },
    payment_status: {
        type: String,
        enum: ['Successful', 'Failed', 'Pending'],
        trim: true
    },
    transaction_id: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Past'],
        default: "Upcoming",
        trim: true
    },
    total_cancelled_ticket: {
        type: Number,
        trim: true,
        default: 0
    },
    total_remaining_ticket: {
        type: Number,
        trim: true,
        default: 0
    },
    total_remaining_tickets_to_scan: {
        type: Number,
        trim: true,
        default: 0
    },
    total_scanned_tickets: {
        type: Number,
        trim: true,
        default: 0
    },
    cancellation_info: [{
        cancel_date: {
            type: String,
            trim: true
        },
        total_cancel_ticket: {
            type: Number,
            trim: true
        },
        cancel_reason: {
            type: String,
            trim: true
        },
        refund_amount: {
            type: Number,
            trim: true
        },
        refund_notes: {
            type: String,
            trim: true
        }
    }],

},
    {
        timestamps: true
    }
);

const ticket = mongoose.model('ticket', TicketSchema);

module.exports = ticket;