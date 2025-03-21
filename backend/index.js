const express=require("express");
const app = express();

const userRoutes = require("./routes/User")
const profileRoutes = require("./routes/Profile")
const courseRoutes = require("./routes/Course")
const paymentRoutes = require("./routes/Payments") 
const contactUsRoute = require("./routes/Contact");


const database=require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const {cloudinaryConnect} =require("./config/cloudinary");
const fileUpload=require("express-fileupload")
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

// Connect to Mongo database
database.connectDB();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:3000",
    credentials:true,
}));
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir:"/temp/"
}));


// cloudinary connection
cloudinaryConnect();

// mount api routes
app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/course",courseRoutes);
app.use("/api/v1/payment",paymentRoutes);
app.use("/api/v1/reach",contactUsRoute);


// default route
app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"Your server is up and running!"
    });
});

// Activate server
app.listen(PORT,(req,res)=>{
    console.log(`Server is running on PORT ${PORT}`);
});