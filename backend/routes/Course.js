const express = require("express");
const router = express.Router();

const {
  auth,
  isAdmin,
  isStudent,
  isInstructor,
} = require("../middlewares/auth");

const {
  createCourse,
  getCourseDetails,
  showAllCourses,
  editCourse,
  deleteCourse,
  getInstructorCourses,
  getFullCourseDetails,
} = require("../controllers/Course");

const {
  categoryPageDetails,
  createCategory,
  showAllCategories,
} = require("../controllers/Category");

const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/Section");

const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require("../controllers/SubSection");

const {
  createRatingAndReview,
  getAverageRating,
  getAllRating,
  getCourseRating,
} = require("../controllers/RatingAndReview");

const {updateCourseProgress} = require("../controllers/CourseProgress");
// ****************************************************************************
// ******************************COURSE ROUTES*********************************
// ****************************************************************************
router.post("/createCourse", auth, isInstructor, createCourse);
router.post("/getCourseDetails", getCourseDetails);
router.put("/editCourse", auth, isInstructor, editCourse);
router.post("/deleteCourse",auth,isInstructor,deleteCourse);
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);
router.post("/getFullCourseDetails", auth, getFullCourseDetails);
router.get("/showAllCourses", showAllCourses);

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

// ****************************************************************************
// ******************************CATEGORY ROUTES*********************************
// ****************************************************************************
router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", categoryPageDetails);

// ****************************************************************************
// ******************************SECTION ROUTES*********************************
// ****************************************************************************
router.post("/createSection", auth, isInstructor, createSection);
router.put("/updateSection", auth, isInstructor, updateSection);
router.delete("/deleteSection", auth, isInstructor, deleteSection);

// ****************************************************************************
// ******************************SUB-SECTION ROUTES*********************************
// ****************************************************************************
router.post("/createSubSection", auth, isInstructor, createSubSection);
router.put("/updateSubSection", auth, isInstructor, updateSubSection);
router.delete("/deleteSubSection", auth, isInstructor, deleteSubSection);

// ****************************************************************************
// ******************************SUB-SECTION ROUTES*********************************
// ****************************************************************************
router.post("/createSubSection", auth, isInstructor, createSubSection);
router.put("/updateSubSection", auth, isInstructor, updateSubSection);
router.delete("/deleteSubSection", auth, isInstructor, deleteSubSection);

// ****************************************************************************
// ******************************RATING-REVIEW ROUTES*********************************
// ****************************************************************************
router.post("/createRating", auth, isStudent, createRatingAndReview);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRating);
router.get("/getCourseRating", getCourseRating);


module.exports=router;
