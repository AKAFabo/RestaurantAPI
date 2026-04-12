import mongoose from "mongoose";
const menuSchema = new mongoose.Schema({
    restaurant_id:{
        type: Number,
        required: true
    },
    name:{
        type: String,
        required:true
    }
}, {timestamps: { createdAt: 'created_at' }}
)

export default mongoose.model("Menu",menuSchema);