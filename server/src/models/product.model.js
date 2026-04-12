import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    menu_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Menu",
        required: true

    },
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    available:{
        type:Boolean,
        
        default:true

    }

});

export default mongoose.model("Product",productSchema)