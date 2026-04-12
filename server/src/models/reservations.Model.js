import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({

    user_id: {
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },

    table_id: {
        type: Number,
        required: true
    },
    reservation_time: {
        type: Date,
        required: true
    },
    status:{
        type:String,
        default:"Active"
    },
},{ timestamps: { createdAt: 'created_at' } });

export default mongoose.model("Reservation",reservationSchema);