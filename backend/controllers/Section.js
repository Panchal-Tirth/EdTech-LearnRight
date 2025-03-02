const Section = require("../models/Section");
const Course = require("../models/Course");
const User = require("../models/User");
const SubSection = require("../models/SubSection");

// create Section
exports.createSection = async(req,res)=>{
    try {
        // fetch Section name
        const {sectionName,courseId}=req.body;
        //data validation
        if(!sectionName||!courseId){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            });
        }
        //create new section
        const newSection=await Section.create({sectionName:sectionName});

        // update course with section ObjectID
        const updatedCourseDetails=await Course.findByIdAndUpdate(courseId,{$push:{courseContent:newSection._id}},{new:true}).populate("courseContent").exec();    

        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            data:updatedCourseDetails
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server Error while creating Section"
        })
    }
}

exports.updateSection=async(req,res)=>{
    try {
        // get data
        const {sectionName,sectionId,courseId} = req.body;
        //validation
        if(!sectionName||!sectionId){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            });
        }
        // update section
        const updateSectionDetails=await Section.findByIdAndUpdate(sectionId,{sectionName:sectionName},{new:true});

        const course = await Course.findById(courseId)
		.populate({
			path:"courseContent",
			populate:{
				path:"subSection",
			},
		})
		.exec();

        return res.status(200).json({
            success:true,
            message:"Section Updated Successfully",
            data:course,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error while updating Section"
        })
    }
}


exports.deleteSection = async(req,res)=>{
    try {
        // get Id - assuming that we are sending ID in params
        const {sectionId,courseId}=req.body; 
        // TODO:do we need to remove it from courseSchema as well
        await Course.findByIdAndUpdate(courseId,{$pull:{
            courseContent:sectionId
        }})

        // delete subsections
        const section=await Section.findById(sectionId);

        await SubSection.deleteMany({_id:{$in:section.subSection}});

        // use findbyIdAndDelete

        const deleteSectionDetails = await Section.findByIdAndDelete(sectionId);


        const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();
        // return response
        return res.status(200).json({
            success:true,
            message:"Section deleted successfully",
            data:course,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server Error while deleting Section"
        })
    }
}