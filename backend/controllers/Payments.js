const {instance}= require("../config/razorpay");
const Course=require("../models/Course");
const CourseProgress=require("../models/CourseProgress");
const User=require("../models/User");
const {mailSender}=require("../utils/mailSender");
const{courseEnrollmentEmail}=require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");

require("dotenv").config();


// initiate the razorpay order

exports.capturePayment=async(req,res)=>{
    const {courses}=req.body;
    const userId=req.user.userId; 


    if(courses.length===0){
        return res.status(400).json({
            success:false,
            message:"Please Provide Course to Purchase",
        });
    };
    
    let totalAmount=0;

    for(const courseId of courses){
        let course;
        try {
            course= await Course.findById(courseId);
            if(!course){
                return res.status(404).json({
                    success:false,
                    message:`Course with ${courseId} Not Found`,
                })
            }

            const uid=new mongoose.Types.ObjectId(userId);

            if(course.studentsEnrolled.includes(uid)){
                return res.status(400).json({
                    success:false,
                    message:"Student is already Enrolled!"
                });
            }
            totalAmount+=course.price;

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                success:false,
                message:error.message,
            })
        }
    };
    const currency="INR";
    const options={
        amount:totalAmount*100,
        currency:currency,
        receipt:Math.random(Date.now()).toString(),
    };

    try {
        const paymentResponse=await instance.orders.create(options);
        res.status(200).json({
            success:true,
            message:"Course Bought Successfully!",
            data:paymentResponse,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error while Creating Order!",
        })
    }
};


// authorize payment and enroll user to course
// verify signature of Razorpay and server

exports.verifyPayment=async(req,res)=>{
    const razorpay_order_id=req.body?.razorpay_order_id;
    const razorpay_payment_id=req.body?.razorpay_payment_id;
    const razorpay_signature=req.body?.razorpay_signature;

    const courses=req.body?.courses;
    const userId=req.user.userId;

    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId){
        return res.status(400).json({
            success:false,
            message:"Payment Failed",
        })
    }

    let body=razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

    if(expectedSignature===razorpay_signature){
        // enroll student in course
        await enrollStudents(courses,userId,res);

        //return response
        return res.status(200).json({
            success:true,
            message:"Payment Verified Successfully",
        })
    }

    return res.status(500).json({
        success:false,
        message:"Payment Verification Failed",
    })

};


const enrollStudents=async(courses,userId,res)=>{

    if(!courses||!userId){
        return res.status(400).json({
            success:false,
            message:"Please provide data for courses and Student ID",
        });
    };

    for(const courseId of courses){
        try {
            // find course and enroll student in it
            const enrolledCourse=await Course.findOneAndUpdate(
                {_id:courseId},
                {$push:{studentsEnrolled:userId}},
                {new:true},
            );

            if(!enrolledCourse){
                return res.status(404).json({
                    success:false,
                    message:"Course Not Found while enrolling Student",
                })
            };
            console.log("Updated course: ", enrolledCourse)

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            })
            // find the student and add the course to their list of enrolledcourses
            const enrolledStudent = await User.findByIdAndUpdate(
                {_id:userId},
                {$push:{
                    courses:courseId,
                    courseProgress:courseProgress._id,
                }}
            )  
            console.log("Enrolled student: ", enrolledStudent);

            // send Email
            const emailResponse=await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName,`${enrolledStudent.firstName} ${enrolledStudent.lastName}`),
            );

            console.log("Email Sent Successfully :",emailResponse);
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message,
            })
        }
    };
};

exports.sendPaymentSuccessEmail=async(req,res)=>{
    const {orderId,paymentId,amount}=req.body;

    const userId=req.user.userId;
    if(!orderId||!paymentId||!amount){
        return res.status(400).json({
            success:false,
            message:"Pleas provide all the fields",
        });
    };

    try {
        const enrolledStudent=await User.findById(userId);

        await mailSender(
            enrolledStudent.email,
            "Payment Received",
            paymentSuccessEmail(
                `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,amount/100,orderId,paymentId
            )
        )

        return res.status(200).json({
            success:true,
            message:"Payment Success email sent successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Could not send Email"
        })
    }

};

// capture payment and initiate the razorpay Order
// exports.createOrder=async(req,res)=>{
    
//         // get courseid and userid
//         const {courseId}=req.body;  
//         const userId=req.user.userId;   

//         // validation
//         if(!courseId){
//             return res.status(400).json({
//                 success:false,
//                 message:"Please provide course id",
//             })
//         };

//         // find course and validate courseDetails
//         let course;
//         try{
//         course=await Course.findById(courseId);
//         if(!course){
//             return res.status(404).json({
//                 success:false,
//                 message:"Course not found",
//             })
//         };
//         //check if user already enrolled/paid for the course
//         const uid=mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uid)){
//             return res.status(400).json({
//                 success:false,
//                 message:"Student have already enrolled for this course",
//             })
//         };
//     }catch (error) {
//         return res.status(500).json({
//             success:false,
//             message:"Internal Server Error while creating order",
//             error:error.message,
//         })
//     }
//     // order create
//     const amount=course.price;
//     const currency="INR";

//     const options={
        // amount:amount*100,
        // currency:currency,
        // receipt:`receipt_${courseId}_${userId}`,
        // notes:{
        //     courseId:courseId,
        //     userId:userId,
        // }
//     };

//     try {
//         // initiate payment using razorpay
//         const paymentResponse=await instance.orders.create(options);
//         console.log(paymentResponse);
        
//         //return response
//         return res.status(200).json({
//             success:true,
//             message:"Order created successfully",
//             orderId:paymentResponse.id,
//             courseName:course.name,
//             courseDescription:course.courseDescription,
//             thumbnail:course.thumbnail,
//             currency:paymentResponse.currency,
//             amount:paymentResponse.amount,  
//         });
//     } catch (error) {
//         console.log(error.message)
//         return res.status(500).json({
//             success:false,
//             message:"Internal Server Error while creating order",
//             error:error.message,
//         });
//     }
// };


// authorize payment and enroll user to course
// verify signature of Razorpay and server

// exports.verifySignature=async(req,res)=>{
//     const webhooksignature='123456';
//     const signature=req.headers['x-razorpay-signature'];
    
//     const shasum=crypto.createHmac('sha256',webhooksignature);
//     shasum.update(JSON.stringify(req.body));
//     const digest=shasum.digest('hex');

//     if(digest=== signature){
//         console.log("Payment is Authorized");
        
//         const {courseId,userId}=req.body.payload.payment.entity.notes;

//         try {
//             // fulfill the action

//             //find the course and enroll the student in it
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 { _id: courseId },
//                 {$push:{studentsEnrolled:userId}},
//                 {new:true},
//             );


//             // find the user and add course to user's enrolledCourses
//             const enrolledStudent=await User.findOneAndUpdate({_id:userId},{$push:{courses:courseId}},{new:true});

//             // mail send for confirmation
//             const emailResponse=await mailSender(enrolledStudent.email,"Course Registration Confirmation",courseEnrollmentEmail(enrolledCourse.name,enrolledStudent.name));
//             console.log(emailResponse)
//             return res.status(200).json({
//                 success:true,
//                 message:"Signature verified and Course enrolled successfully"
//             });

//         } catch (error) {
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             })
//         }
//     } else{
//         return res.status(400).json({
//             success:false,
//             message:"Error in verifying signature"
//         })
//     }

// };