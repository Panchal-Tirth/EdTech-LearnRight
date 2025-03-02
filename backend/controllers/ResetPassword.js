// forget password
const User=require("../models/User");
const {mailSender}=require("../utils/mailSender");
const bcrypt=require("bcrypt");
const crypto=require("crypto");
// resetPassword Token 
exports.resetPasswordToken=async(req,res)=>{
    try {
        // fetch email from req.body
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const { email } = req.body;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email",
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Your Email is not Registered",
            });
        }
        // generate token
        const token = crypto.randomUUID();
        // update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate({ email: email }, {
            token: token,
            resetPasswordExpires: Date.now() + 5 * 60 * 1000,
        }, { new: true });
       
        const url = `http://localhost:3000/update-password/${token}`;

        // send mail
        await mailSender(
            email,
            "Password Reset Link",
            `Click the link to reset your password: ${url}`,
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "Reset password email sent successfully",
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Server Error while resetting password",
        });
    }

};


// Password reset confirm

exports.resetPasswordConfirm=async(req,res)=>{
    try {
        // fetch data 
        // token will be added in body from frontend 
        const {password,confirmPassword,token}=req.body;
        
        // validation
        if(password!==confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Passwords do not match during reset password"
            });
        }
        //geet userdetails from db using token
        const userDetails=await User.findOne({token});

        // if no entry - invalid token 
        if(!userDetails){
            return res.status(401).json({
                success:false,
                message:"Invalid Token"});
            }   
        // check token expiration
        if( userDetails.resetPasswordExpires<Date.now()){
            return res.status(401).json({
                success:false,
                message:"Token expired , please regenerate your token"
            });
        }
        // hash password and update
        const hashedPassword=await bcrypt.hash(password,10) ;
        
        await User.findOneAndUpdate({token:token},{password:hashedPassword,token:"",resetPasswordExpires:""},{new:true});

        return res.status(200).json({
            success:true,
            message:"Password reset successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error while resetting password"
        });
    }
};