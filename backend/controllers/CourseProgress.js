const CourseProgress=require("../models/CourseProgress");


exports.updateCourseProgress = async(req,res)=>{
    try {
        const {courseId,subsectionId}=req.body;
        const usedId=req.user.userId;
        //validation

        if(!courseId||!subsectionId){
            return res.status(400).json({
                success:false,
                message:"Please fill all the fields"
            })
        }

        //find course progress
        // console.log("CourseId:",courseId);
        // console.log("UserId:",usedId);
        let courseProgress = await CourseProgress.findOne({userId:usedId,courseID:courseId});
        console.log("Course Progress:",courseProgress);
        if(!courseProgress){
            return res.status(404).json({
                success:false,
                message:"Course Progress Not Found"
            })
        }
        else {
            // If course progress exists, check if the subsection is already completed
            if (courseProgress.completedVideos.includes(subsectionId)) {
              return res.status(400).json({ error: "Subsection already completed" })
            }
            // Push the subsection into the completedVideos array
            courseProgress.completedVideos.push(subsectionId)
          }

        //update course progress
        await courseProgress.save();

        return res.status(200).json({
            success:true,
            message:"Course Progress Updated Successfully",
            data:courseProgress
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error while updating Course Progress"
        })
    }
};

