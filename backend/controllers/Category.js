const Category=require("../models/Category");
const Course = require("../models/Course");
function  getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }
// create Category handler function

exports.createCategory = async(req,res)=>{
    try {
        // fetch data
        const {name,description}=req.body;

        // validation
        if(!name||!description){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            });
        }
        // create entry in db
        const categoryDetails=await Category.create({
            name:name,
            description:description,
        });

        console.log(categoryDetails);

        //return response
        return res.status(200).json({
            success:true,
            message:"Category Created Successfully"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server Error while creating Category"
        });
    }
};


// get all Category handler function

exports.showAllCategories=async(req,res)=>{
    try {
        //get all category
        const allCategory=await Category.find({},{name:true,description:true,courses:true}).populate("courses").exec();
        res.status(200).json({
            success:true,
            message:"All Category Returned successfully",
            data:allCategory,    
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Server Error while Getting all categories"
        })
    }
};

//category page details
exports.categoryPageDetails=async(req,res)=>{
    try {
        // get categoryID
        const {categoryId}=req.body;
        console.log(categoryId)
        // get courses for specified Id
        const selectedCategory=await Category.findById(categoryId)
        .populate({
            path:"courses",
            populate:{
                path:"instructor",
            }
        }).exec();
        console.log("HELLO",selectedCategory)
        if(!selectedCategory){
            return res.status(400).json({
                success:false,
                message:"Category not found"
            });
        }
        // validation 
        if(selectedCategory.courses.length===0){
            return res.status(404).json({
                success:false,
                message:"No courses found for this category"
            })
        };

        // get different courses for suggestion
        const differentCategories=await Category.find({
            _id:{$ne:categoryId}
        }).populate("courses").exec();

        // const randomCategories=await Category.aggregate([
        //     {$sample:{size:differentCategories.length}}
        // ]);
        let differentCategory = await Category.findOne(
            differentCategories[getRandomInt(differentCategories.length)]
              ._id
          )
            .populate({
              path: "courses",
              match: { status: "Published" },
              populate:{
                path:"instructor"
              }
            })
            .exec()
            //console.log("Different COURSE", differentCategory)
          // Get top-selling courses across all categories
          const allCategories = await Category.find({})
            .populate({
              path: "courses",
              populate:{
                path:"instructor"
              },
              
              match: { status: "Published" },
            })
            .exec()
        // top selling courses
        // const topSellingCourses=await Course.find({}).sort({"studentsEnrolled.length":-1});
        // console.log("Most selling Courses:",topSellingCourses); 

        const allCourses = allCategories.flatMap((category) => category.courses)
        const topSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
        console.log("Most selling Courses:",topSellingCourses); 
            
        return res.status(200).json({
            success:true,
            message:"Category page details returned successfully",
            data:{
                selectedCategory,
                differentCategory,
                topSellingCourses,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server error"
        })
    }
};