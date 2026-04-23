import mongoose from "mongoose";
const menuSchema = new mongoose.Schema({
    restaurant_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Restaurant"
    },
    name:{
        type: String,
        required:true
    },
    products:[
    {
    _id:{
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      required:true
    },
    name:{
      type:String,
      required:true
    },
    description:{
        type:String,
        default:"Producto sin descripción"
    },
    category:{   
      type:String,
      required:true
    },
    price:{
      type:Number,
      required:true
    },
    available:{
      type:Boolean,
      required:true
    }
     }
    ]


}, {timestamps: { createdAt: 'created_at' }}
)

export default mongoose.model("Menu",menuSchema);