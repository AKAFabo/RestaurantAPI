import mongoose from "mongoose";

const userLocationSchema = new mongoose.Schema({

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    latitude: {
        type: Number,
        required: true
    },

    longitude: {
        type: Number,
        required: true
    },

    address: {
        type: String,
        default: null
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "UserLocation",
    userLocationSchema
);