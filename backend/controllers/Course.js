const Course=require("../models/Course");
const Category=require("../models/Category");
const User=require("../models/User");
const {uploadImageToCloudinary}=require("../utils/imageUploader");
const { default: mongoose } = require("mongoose");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress=require("../models/CourseProgress");
const { convertToDuration } = require("../utils/secToDuration");
const RatingAndReview=require("../models/RatingAndReview");

// create course handler function

exports.createCourse= async(req,res)=>{
    try {
        //fetch data
        const { courseName,courseDescription,price,category,whatYouWillLearn ,status,instructions}=req.body;
        const thumbnail=req.files.thumbnailImage;

        // validation
        if(!courseName||!courseDescription||!price||!category||!whatYouWillLearn||!status||!instructions){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            });
        };
        // get instructor details
        const userId=req.user.userId;
        console.log("WITH GREAT POWER COMES GREAT RESPONSIBILITY!")
        console.log("User Id:",userId)

        // TODO :  verify if user.id and instructor.id
        // const instructorDetails=await User.findById(userId);

        // console.log("Instructor Details: ",instructorDetails);
        // if(!instructorDetails){
        //     return res.status(404).json({
        //         success:false,
        //         message:"Instructor not found"
        //     });
        // }

        // check given Category is valid or not
        
        const categoryDetails = await Category.findOne({_id:category});
        if(!categoryDetails){
            return res.status(404).json({
                success:false,
                message:"Category not found"
            });
        }

        // upload image to cloudinary
        const thumbnailImage=await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

        // create an entry for new course
        const newCourse=await Course.create({
            courseName,
            courseDescription,
            instructor:userId,
            price,
            Category:categoryDetails._id,
            whatYouWillLearn,
            thumbnail:thumbnailImage.secure_url,
            status:status,
            instructions:instructions,
        });

        // add the new course to user schema of instructor
        await User.findByIdAndUpdate(
            {_id:userId},
            {
                $push:
                { courses:newCourse._id }
            },
            {new:true});
        
        // update Category schema
        await Category.findByIdAndUpdate(
            {_id:categoryDetails._id},
            {
                $push:
                { courses:newCourse._id }
            },
            {new:true}
        );

        // return response
        return res.status(200).json({
            success:true,
            message:"Course created successfully",
            data:newCourse,
        });

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Something went wrong while creating the course",
            error:error.message,
        });
    }
}

//getAllCourses handler function

exports.showAllCourses = async(req,res) => {
    try {
        // get all courses
        
        const allCourses = await Course.find({});

        return res.status(200).json({
            success:true,
            message:"All courses returned successfully",
            data:allCourses,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Something went wrong while getting all courses",
            error:error.message,
        });
    }
};

//HW
//get course details handler

exports.getCourseDetails=async(req,res)=>{
    try {
        //get courseID
        const {courseId}=req.body;
        console.log("Course ID:",req.body);
        // validate
        if(!courseId){
            return res.status(400).json({
                success:false,
                message:"Invalid CourseId"
            });
        };

        // find coursedetails
        const courseDetails=await Course.findById(courseId)
        .populate(
            {
                path:"instructor",
                populate:{
                    path:"additionalDetails"
                }
            }
        )
        .populate("Category")
        .populate("ratingAndReviews")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection"
            }
        }).exec();

        if(!courseDetails){
            return res.status(404).json({
                success:true,
                message:"Course Not Found"
            })
        }

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
          content.subSection.forEach((subSection) => {
            const timeDurationInSeconds = parseInt(subSection.timeDuration)
            totalDurationInSeconds += timeDurationInSeconds
          })
        })

        const totalDuration = convertToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success:true,
            message:"Course Details Fetched successfully",
            data:{
              courseDetails,
              totalDuration,
            },
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server error while getting Course details"
        })
    }
};

// get All Courses 
exports.getAllCourses = async (req, res) => {
    try {
      const allCourses = await Course.find(
        { status: "Published" },
        {
          courseName: true,
          price: true,
          thumbnail: true,
          instructor: true,
          ratingAndReviews: true,
          studentsEnrolled: true,
        }
      )
        .populate("instructor")
        .exec();
  
      return res.status(200).json({
        success: true,
        data: allCourses,
      })
    } catch (error) {
      console.log(error)
      return res.status(404).json({
        success: false,
        message: `Can't Fetch Course Data`,
        error: error.message,
      })
    }
  }

// Get full coursedetails
exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body;
      const userId = req.user.userId;
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("Category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec();
  
      let courseProgressCount = await CourseProgress.findOne({
        courseID: courseId,
        userId: userId,
      });
  
      console.log("courseProgressCount : ", courseProgressCount);
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      };
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
     console.log(error)
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.userId;
    
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 });
    //   console.log("Instructor Courses:",instructorId)
      // Return the instructor's courses
      return res.status(200).json({
        success: true,
        message:"Instructor Courses returned succesfully!",
        data: instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
  }

// Edit Course Details
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("Category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
}

exports.deleteCourse=async(req,res)=>{
    try {
        const {courseId}=req.body;
        const course = await Course.findById(courseId).populate("courseContent").exec();

        if(!course){
            return res.status(404).json({
                success:false,
                message:"Cannot Find Course"
            });
        }

        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled;
        for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
            $pull: { courses: courseId },
        })
        }

        // Delete sections and sub-sections
        for(const section of course.courseContent){
            await SubSection.deleteMany({_id:{$in:section.subSection}});
        };

        await Section.deleteMany({_id:{$in:course.courseContent}});
        await RatingAndReview.deleteMany({course:courseId});
        await Category.deleteOne({courses:courseId});
        await Course.findByIdAndDelete(courseId);

       return res.status(200).json({
             success:true,
             message: "Course and related sections/subsections deleted successfully" ,
            });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:error,
        })
    }
};