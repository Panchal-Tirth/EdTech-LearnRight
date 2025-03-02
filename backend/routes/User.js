const express=require("express");

const router=express.Router();

const {login,signUp,sendOTP,changePassword}=require("../controllers/Auth");
const {resetPasswordConfirm,resetPasswordToken}=require("../controllers/ResetPassword");
const {auth}=require("../middlewares/auth");

// Routes for Login,SignUp,Authentication

router.post("/login",login);

router.post("/signup",signUp);

router.post("/sendotp",sendOTP);

router.post("/changepassword",auth,changePassword);

router.post("/reset-password",resetPasswordToken);

router.post("/reset-password-confirm",resetPasswordConfirm);


module.exports=router;