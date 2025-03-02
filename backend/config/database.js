const mongoose=require("mongoose");
require("dotenv").config();

exports.connectDB=()=>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=>{
        console.log("Database Connected Successfully!");
    })
    .catch((err)=>{
        console.log("Error Connecting to Database");
        console.log("error ",err)
        process.exit(1);
    })
};