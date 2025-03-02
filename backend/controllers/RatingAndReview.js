const RatingAndReview=require("../models/RatingAndReview");
const Course=require("../models/Course");
const { default: mongoose } = require("mongoose");


// create RatingAndReview

exports.createRatingAndReview=async(req,res)=>{
    try {
        // get data from req.body
        const {rating,review="",courseId}=req.body;
        const userId=req.user.userId;
        // validate
        if(!rating || !courseId){
            return res.status(400).json({
                success:false,
                message:"All fields require Rating and CourseId"
            });
        };
        // get courseDetails
        const courseDetails=await Course.findOne({_id:courseId,studentsEnrolled:{$elemMatch:{$eq:userId}}});
        // check if user is enrolled or not  
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:"Student not enrolled in course"
            })
        };
        // check if user has already reviewed the course
        const alreadyReviewed=await RatingAndReview.findOne({
            user:userId,
            course:courseId,
        })
        if(alreadyReviewed){
            return res.status(403).json({
                success:false,
                message:"Course is already reviewed by user"
            })
        };
        //create rating
        const ratingReview = await RatingAndReview.create({
            rating:rating,
            review:review,
            course:courseId,
            user:userId,
        });
        
        // update course with this review
        const updateCourse=await Course.findByIdAndUpdate({_id:courseId},{$push:{ratingAndReviews:ratingReview._id }},{new:true }).populate("ratingAndReviews").exec();

        return res.status(200).json({
            success:true,
            message:"Rating And Review Submitted Successfully!",
            ratingReview,
            updateCourse,   
        });

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error while creating Rating and review"
        })
    }
};

// get average rating
exports.getAverageRating=async(req,res)=>{
    try {
        // get courseId
        const {courseId}=req.body;
        
        //  calculate avg rating
        const result=await RatingAndReview.aggregate([
            {
                $match:{
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg:"rating"},
                }
            },
        ]);

        // return result
        if(result.length>0){
            return res.status(200).json({
                success:true,
                message:"Average rating returned successfully",
                averageRating:result[0].averageRating,
            })
        };

        return res.status(200).json({
            success:true,
            message:"Average rating is 0, No rating given yet",
            averageRating:0,
        });
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Serve Error in fetching avg rating"
        })
    }
}

// get all ratingReview
exports.getAllRating=async(req,res)=>{
    try {
        //get all rating 
        const allRatingReviews=await RatingAndReview.find({})
                                     .sort({rating:"desc"})
                                     .populate({
                                        path:'user',
                                        select:"firstName lastName email image"
                                     })
                                     .populate({
                                        path:"course",
                                        select:"courseName",
                                     }).exec();
        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data:allRatingReviews,
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal server Error while fetching all reviews and ratings"
        })
    }
};

// get ratingreview based on specific course
exports.getCourseRating=async(req,res)=>{
    try {
        // get courseId
        const {courseId}=req.body;

        
        // Find the course and populate the ratingAndReviews field
        const course = await Course.findById(courseId)
            .populate({
                path: "ratingAndReviews",
                populate: { path: "user", select: "name email" } // Also fetch user details (optional)
            }).exec().lean();

        // Check if course exists
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course Not Found"
            });
        }

        return res.status(200).json({
            success: true,
            message:"Course Rating Returned Successfully!",
            data: course,
        });
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error while fetching all rating of a course"
        })
    }
};