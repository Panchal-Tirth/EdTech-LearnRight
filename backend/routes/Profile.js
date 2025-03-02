const express=require("express");
const router=express.Router();

const {updateProfile,deleteAccount,getUserDetails,updateProfileImage,getEnrolledCourses,instructorDashboard}=require("../controllers/Profile");
const {auth, isInstructor}=require("../middlewares/auth");

router.put("/updateProfile",auth,updateProfile);
router.delete("/deleteProfile",auth,deleteAccount);
router.get("/getUserDetails",auth,getUserDetails);

router.put("/updateProfileImage",auth,updateProfileImage);
router.get("/getEnrolledCourses",auth,getEnrolledCourses);
router.get("/instructorDashboard",auth,isInstructor,instructorDashboard);
module.exports=router;