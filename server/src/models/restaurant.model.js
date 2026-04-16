import mongoose from "mongoose";

const restaurantSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    admin_id:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: "User"
    },
    created_at: {
    type: Date,
    default: Date.now
    },
    tables:[
        {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      table_number: {
        type: Number,
        required: true
      },
      capacity: {
        type: Number,
        required: true
      }
    }
    ]

    
})

export default mongoose.model("Restaurant",restaurantSchema);