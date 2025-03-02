const cloudinary=require("cloudinary").v2;
require("dotenv").config();
exports.cloudinaryConnect=(req,res)=>{
    try {
        cloudinary.config({
            cloud_name: process.env.ClOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
        });
    } catch (error) {
        console.log(error)
    }
};