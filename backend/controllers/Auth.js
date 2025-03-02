const User = require("../models/User.js");
const OTP = require("../models/OTP.js");
const Profile = require("../models/Profile.js");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {mailSender}=require("../utils/mailSender.js");
require("dotenv").config();

// send otp for verification
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from req.body
    const { email } = req.body;

    // check if user already exists
    const checkUserExist = await User.findOne({ email });

    if (checkUserExist) {
      return res.status(401).json({
        success: false,
        message: "User already Registered.Try to Login",
      });
    }

    //Generate OTP
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log("OTP Generated ", otp);

    // //check if otp is unique or not
    // const result = await OTP.findOne({otp:otp});

    // while(result){
    //     otp = otpGenerator.generate(6,{
    //         upperCaseAlphabets:false,
    //         lowerCaseAlphabets:false,
    //         specialChars:false,
    //     });
    //     result=await OTP.findOne({otp:otp});
    // };

    const otpPayload = { email, otp };

    // create an entry in DB
    const newOTP = await OTP.create(otpPayload);
    console.log(newOTP);

    // return response
    return res.status(200).json({
      success: true,
      message: "OTP sent Successfully!",
      otp,
    });
  } catch (error) {
    console.log("Error Generating OTP :", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SignUp
exports.signUp = async (req, res) => {
  try {
    // fetch data from req body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;
    //validate data
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    //password and confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    //check user already exist or not
    const existingUser = await User.findOne({ email:email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already Registered",
      });
    }
    //find most recent otp
    const recentOTP = await OTP.find({ email })
      .sort({ createAt: -1 })
      .limit(1);
    console.log("Recent OTP",recentOTP);

    // validate otp
    if (recentOTP.length == 0) {
      //OTP not found
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    } else if (otp !== recentOTP[0].otp) {
      // invalid otp
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    //create entry in db

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      accountType,
      password: hashedPassword,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
    });
    //return response
    return res.status(200).json({
      success: true,
      message: "User registered Successfully!",
      newUser,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "User cannot be registered . Please try again",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    //get data from req body
    const { email, password } = req.body;

    // validate data
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //user check if exists or nott
    const user = await User.findOne({ email }).populate("additionalDetails").exec();
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found .Try to SignUp",
      });
    }

    //generate JWT , after password checking
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        userId: user._id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      // user = user.toObject();
      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      
      //create cookie and send response
      return res.cookie("token",token, options).status(200).json({
        success: true,
        message: "User Logged in Successfully",
        token,
        user,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is Incorrect",
      });
    }

  } catch (error) {
    console.log(error);
    return res.json(500).json({
      success: false,
      message: "User cannot be logged in . Please try again",
    });
  }
};


// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    // console.log("USER HAI:",user.password);
    // console.log("OLD ONE :",oldPassword);
    // console.log("COMPARISON :",await bcrypt.compare(oldPassword, user.password))

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await mailSender(user.email, "Password Updated Successfully", "Your Password has been updated successfully");

    return res.status(200).json({ success: true, message: "Password Updated Successfully" });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
