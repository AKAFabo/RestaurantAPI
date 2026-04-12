import mongoose from "mongoose";

const orderSchema= new mongoose.Schema({

    user_id:{
        type:Number,
        required:true
    },
    restaurant_id:{
        type:Number,
        required: true
    },
    reservation_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Reservation",
        required:true
    },
    status:{
        type:String,
        default:"Pending"
    },
    total:{
        type:Number,
        required:true
    }

},{ timestamps: { createdAt: 'created_at' } }
);

export default mongoose.model("Order",orderSchema);