import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({

    user_id: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    restaurant_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required:true
    },

    table_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    reservation_time: {
        type: Date,
        required: true
    },
    status:{
        type:String,
        default:"CONFIRMED",
        enum:["CONFIRMED","CANCELLED"]
    },
    created_at:{
        type:Date,
        required:true
    }
} );

export default mongoose.model("Reservation",reservationSchema);