// Profile Entry gets created during signUp
const Course = require("../models/Course");
const Profile=require("../models/Profile");
const User = require("../models/User");
const CourseProgress=require("../models/CourseProgress");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertToDuration } = require("../utils/secToDuration");
const cloudinary = require('cloudinary').v2; 
require("dotenv").config();
//upadate profile
exports.updateProfile=async (req,res)=>{
    try {
        // get updated data
        const {gender,contactNumber,dateOfBirth="",about=""}=req.body;
        const userId=req.user.userId;
        //validation
        if(!gender||!contactNumber){
            return res.status(400).json({
                success:false,
                message:"Please fill all the fields"
            })
        };
        // find profile
        const userDetails=await User.findOne({_id:userId});
        const profileId=userDetails.additionalDetails;

        // update
        const updatedProfile=await Profile.findByIdAndUpdate(profileId,{
            gender:gender,
            contactNumber:contactNumber,
            dateOfBirth:dateOfBirth,
            about:about,
        },{new:true});

        const updatedUserDetails = await User.findById(userId)
        .populate("additionalDetails")
        .exec();
        //return response
        return res.status(200).json({
            success:true,
            message:"Profile Updated Successfully",
            data:updatedUserDetails,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error while updating Profile"
        })
    }
}


//delete Account
exports.deleteAccount=async(req,res)=>{
    try {
        //get data
        const userId=req.user.userId;
        //validation
        const userDetails=await User.findById(userId);
        if(!userDetails){
            return res.status(400).json({
                success:false,
                message:"User not found"
            })
        }
        //delete profile
        await Profile.findByIdAndDelete(userDetails.additionalDetails);
        // TODO : unenrolled user from all enrolled students
        //delete user
        await User.findByIdAndDelete(userId);
        //return response
        return res.status(200).json({
            success:true,
            message:"Account deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error while deleting Account"
        })
    }
}

// get all user details
exports.getUserDetails=async(req,res)=>{
    try {
        // get id
        const id=req.user.userId;

        //validation and get user details
        const userDetails=await User.findById(id).populate("additionalDetails").exec();

        //return response
        return res.status(200).json({
            success:true,
            message:"User Details returned successfully",
            data:userDetails,
        });
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error while getting all User Details"
        })
    }
};

exports.updateProfileImage=async(req,res)=>{
    try {
        const {displayPicture}=req.files;
        const userId=req.user.userId;
        


        // Fetch user to get the current image's public ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        // Delete the old image from Cloudinary if it exists
        if (user.image) {
            const publicId = process.env.FOLDER_NAME+"/"+user.image.split('/').pop().split('.')[0]; // Extract public ID from URL
            console.log(publicId);
            const deletionResponse = await cloudinary.uploader.destroy(publicId);
            console.log("Old image deleted:", deletionResponse);
        }
        
        // upload new image to cloudinary
        const updatedImage=await uploadImageToCloudinary(displayPicture,process.env.FOLDER_NAME);
        console.log(updatedImage);

        const updateUserImage=await User.findByIdAndUpdate({_id:userId},{image:updatedImage.secure_url},{new:true});

        if(!updateUserImage){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        };

        return res.status(200).json({
            success:true,
            message:"Profile Image Updated Successfully",
            data:updateUserImage,
        })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong updating profile picture"
        })
    }
};

exports.getEnrolledCourses=async(req,res)=>{
    try {   
        // get user from req.user
        const userId=req.user.userId;
        
        if(!userId){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        //get enrolled courses
        let userEnrolledCourses=await User.findById(userId)
        .populate({
            path:"courses",
            populate:{
                path:"courseContent",
                populate:{
                    path:"subSection"
                }
            }
        })
        .exec();
        userEnrolledCourses=userEnrolledCourses.toObject();
        
        var subSectionLength=0;

        for(i=0;i<userEnrolledCourses.courses.length;i++){
            let totalTimeDuration=0;
            subSectionLength=0;

            for(j=0;j<userEnrolledCourses.courses[i].courseContent.length;j++){
                totalTimeDuration+=userEnrolledCourses.courses[i].courseContent[j].subSection.reduce((acc,curr)=>acc+parseInt(curr.timeDuration),0);

                userEnrolledCourses.courses[i].totalDuration=convertToDuration(totalTimeDuration);

                subSectionLength+=userEnrolledCourses.courses[i].courseContent[j].subSection.length;
            }

            let courseProgressCount=await CourseProgress.findOne({courseID:userEnrolledCourses.courses[i]._id,userId:userId});

            courseProgressCount=courseProgressCount?.completedVideos?.length;

            if(subSectionLength==0){
                userEnrolledCourses.courses[i].progressPercentage=100;
            }else{
                userEnrolledCourses.courses[i].progressPercentage=Math.round((courseProgressCount/subSectionLength)*100,2);
            }

        }


        if(!userEnrolledCourses){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        return res.status(200).json({
            success:true,
            message:"Enrolled Courses for User returned Successfully",
            data:userEnrolledCourses.courses,
        })
        
    } catch (error) {
        console.log("Error : ",error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while fetching courses"
        });
    }
};

exports.instructorDashboard = async(req,res)=>{
    try {
         const courseDetails = await Course.find({instructor:req.user.userId});

         const courseData = courseDetails.map((course)=>{
            const totalStudents = course.studentsEnrolled.length;
            const totalIncome=course.price*totalStudents;

            // create a new object with the additional fields

            const courseDataWithStats={
                _id:course._id,
                courseName:course.courseName,
                courseDescription:course.courseDescription,
                totalStudentsEnrolled:totalStudents,
                totalAmountGenerated:totalIncome,
            };

            return courseDataWithStats;
         });

         return res.status(200).json({
                success:true,
                message:"Instructor Dashboard data fetched successfully",
                courses:courseData,
         })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error while fetching Instructor Dashboard"
        })
    }
};