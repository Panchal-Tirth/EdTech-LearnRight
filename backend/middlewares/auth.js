const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// authentication
exports.auth = async (req, res, next) => {
  try {
    //fetch token from header
    const token =
      req.cookies.token||
      req.body?.token ||
      req.header("Authorization")?.replace("Bearer ","");

      console.log("Token :",token);
      //check if token exists
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token not found",
        });
      }
      
      // console.log(jwt.decode(token))
    //verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log(decoded);
      req.user = decoded;
    } catch (error) {
      console.log(error)
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
      });
    }

    next();
  } catch (error) {
    console.log("Error Authenticating User:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// isStudent
exports.isStudent=async(req,res,next)=>{
    try {
        const user=req.user;
        if(user.accountType!=="Student"){
            return res.status(401).json({
                success:false,
                message:"This is Protected route for Student Only"
            })
        }
        next();

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User Role Cannot be verified,please try again"
        })
    }
}
// isInstructor
exports.isInstructor=async(req,res,next)=>{
    try {
        const user=req.user;
        if(user.accountType!=="Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is Protected route for Instructor Only"
            })
        }
        next();

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User Role Cannot be verified,please try again"
        })
    }
}

// isAdmin
exports.isAdmin=async(req,res,next)=>{
    try {
        const user=req.user;
        if(user.accountType!=="Admin"){
            return res.status(401).json({
                success:false,
                message:"This is Protected route for Admin Only"
            })
        }
        next();

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User Role Cannot be verified,please try again"
        })
    }
}
