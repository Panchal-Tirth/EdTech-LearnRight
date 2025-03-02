const mongoose=require("mongoose");
const {mailSender}=require("../utils/mailSender")
const otpTemplate=require("../mail/templates/EmailVerification")

const OTPSchema=mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp : {
        type:String,
        required:true,
    },
    createAt:{
        type:Date,
        default:Date.now(),
        expires:5*60, 
    }
});

// function to send verification email
async function sendVerificationEmail(email,otp){
    try {
        const mailResponse = await mailSender(email,"Verification Email From LearnRight",otpTemplate(otp));
        console.log("Email sent successfully",mailResponse);
    } catch (error) {
        console.log("Error occured while sending verification mail")
        console.log(error);
        throw error;
    }
}

OTPSchema.pre("save",async function (next){
    await sendVerificationEmail(this.email,this.otp);
    next();
})


module.exports=mongoose.model("OTP",OTPSchema);