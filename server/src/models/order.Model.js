import mongoose from "mongoose";

const orderSchema= new mongoose.Schema({

    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    restaurant_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Restaurant",
        required:true
    },
    reservation_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Reservation",
        required:false,
        default:null
    },
    status:{
        type:String,
        enum:["PENDING","PAID","CANCELLED"],
        default:"PENDING"
    },
    total:{
        type:Number,
        required:true
    },
    items:[
        {   _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: () => new mongoose.Types.ObjectId()
            },
            product_id:{
                type:mongoose.Schema.Types.ObjectId,
                required:true
            },
            name:{
                type:String,
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
        }
    ]

},{ timestamps: { createdAt: 'created_at' } }
);

export default mongoose.model("Order",orderSchema);