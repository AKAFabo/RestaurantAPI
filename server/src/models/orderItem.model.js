import mongoose from "mongoose";

const orderitemSchema=new mongoose.Schema({
    order_id:{
        type:mongoose.Schema.Types.ObjectId,
        required: true
    },
    product_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        required:true
    }



});

export default mongoose.model("OrderItem", orderitemSchema)