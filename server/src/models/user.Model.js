import mongoose  from "mongoose";

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password_hash:{
        type:String,
        required:true
    },
    role_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref: "Role"
    }
// falta o crear el model de role o meterlo aqui mismo


},{ timestamps: { createdAt: 'created_at' }})

export default mongoose.model("User",userSchema);