const SubSection=require("../models/SubSection");
const Section = require("../models/Section");
const {uploadImageToCloudinary}=require("../utils/imageUploader");
const {convertToDuration} = require("../utils/secToDuration");
const cloudinary=require("cloudinary").v2;
require("dotenv").config();

exports.createSubSection=async(req,res)=>{
    try {
        // fetch data
        const {title,description,sectionId}=req.body;
        const video=req.files.videoFile;
        //validation
        if(!title||!description||!video||!sectionId){
            return res.status(400).json({
                success:false,
                message:"Please fill all the fields"
            });
        }
        // upload video to cloudinary
        const uploadDetails=await uploadImageToCloudinary(video,process.env.FOLDER_VIDEO);
        console.log(uploadDetails) 
        //create subsection
        const newSubSection = await SubSection.create({
            title,
            timeDuration:`${convertToDuration(uploadDetails.duration)}`,
            description,
            videoUrl:uploadDetails.secure_url
        })
        // update sectionSchema with this subSection objectId
        const updatedSectionDetails=await Section.findByIdAndUpdate(sectionId,{$push:{subSection:newSubSection._id}},{new:true})
        .populate("subSection").exec();
        console.log(updatedSectionDetails);
        // return response
        return res.status(200).json({
            success:true,
            message:"SubSection created successfully",
            data:updatedSectionDetails,
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server Error while creating SubSection"
        });
    }
}

exports.updateSubSection=async(req,res)=>{
    try {
        // fetch data
        const {title,description,subSectionId,sectionId}=req.body;
        const subSection = await SubSection.findById(subSectionId)
        // validation
        if (!subSection) {
        return res.status(404).json({
            success: false,
            message: "SubSection not found",
        })
        }

        if (title !== undefined) {
        subSection.title = title
        }

        if (description !== undefined) {
        subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
        const videoPublicId=process.env.FOLDER_VIDEO+"/"+subSection.videoUrl.split('/').pop().split('.')[0];
        
        const deleteResponse=await cloudinary.uploader.destroy(videoPublicId);
        console.log(deleteResponse);

        const video = req.files.video;
        const uploadDetails = await uploadImageToCloudinary(
            video,
            process.env.FOLDER_VIDEO
        );
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${convertToDuration(uploadDetails.duration)}`
        }

        await subSection.save()

        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate(
        "subSection"
        )

        console.log("updated section", updatedSection)
        // return response
        return res.status(200).json({
            success:true,
            message:"SubSection Updated Successfully",
            data:updatedSection
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Server Error while updating SubSection"
        });
    }
}

exports.deleteSubSection=async(req,res)=>{
    try {
        // fetch data
        const {subSectionId,sectionId}=req.body;
        //delete SubSection from section Schema as well
        await Section.findByIdAndUpdate(sectionId,{
            $pull:{
                subSection:subSectionId
            }
        });
        const deleteSubSectionDetails=await SubSection.findByIdAndDelete(subSectionId);
        
        const videoPublicId=process.env.FOLDER_VIDEO+"/"+deleteSubSectionDetails.videoUrl.split('/').pop().split('.')[0];
        console.log(videoPublicId);
        const deleteResponse=await cloudinary.uploader.destroy(videoPublicId,{resource_type: 'video'});
        console.log(deleteResponse);

        const updatedSection=await Section.findById(sectionId).populate("subSection").exec();
        // return response 
        return res.status(200).json({
            success:true,
            message:"SubSection Deleted Successfully",
            data:updatedSection,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server Error while deleting SubSection"
        })
    }
}