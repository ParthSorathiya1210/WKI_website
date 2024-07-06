const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        length:100
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["Admin","User","Visitor"],
        required:true
    },
    image_url:{
        type:String,
        default:"https://res.cloudinary.com/db84tbjky/image/upload/v1715580859/MediaDB/user_asrhse.png"
    }
});

module.exports = mongoose.model("Profile", profileSchema);