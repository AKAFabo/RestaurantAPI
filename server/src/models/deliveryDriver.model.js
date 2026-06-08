import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({

    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    assigned_at: {
        type: Date,
        default: Date.now
    }

}, {
    _id: false
});

const deliveryDriverSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        default: null
    },

    active: {
        type: Boolean,
        default: true
    },

    assignments: {
        type: [assignmentSchema],
        default: []
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "DeliveryDriver",
    deliveryDriverSchema
);