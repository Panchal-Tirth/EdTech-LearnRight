# LearnRight - EdTech Platform

LearnRight is a full-featured EdTech platform built using the MERN stack, providing role-based authentication, course management, student progress tracking, and secure payments.

## Features

- **Role-based Authentication**: Admin, Student, and Instructor authentication using JWT.
- **Password Management**: Forgot password and password reset functionality.
- **User Profiles**: Each user has a profile page with editing capabilities.
- **Course Management**:
  - Instructors can create, edit, delete, and publish courses.
  - Course statistics are available in the instructor dashboard.
  - Courses are categorized (only Admin can create categories).
- **Student Features**:
  - Students can enroll in courses, track their progress, and leave reviews and ratings.
  - Progress tracking in the student dashboard.
- **Payment Gateway**: Integrated Razorpay (test mode) for secure transactions.
- **Media Storage**: Cloudinary is used for media file storage.
- **Responsive UI**: Built using React and Tailwind CSS.
- **State Management**: Implemented using Redux for efficient global state handling.

## Installation and Setup

### Prerequisites
Ensure you have the following installed:
- Node.js
- MongoDB (local or Atlas)
- A Cloudinary account
- A Razorpay account (for test mode payments)

### Clone the Repository
```bash
git clone 
cd EdTech-LearnRight
```

### Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add the following:
```
PORT=4000
MONGODB_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret

# Nodemailer Configuration
MAIL_HOST=your_mail_host
MAIL_USER=your_mail_user
MAIL_PASS=your_mail_password

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary Configuration
CLOUD_NAME=your_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
FOLDER_NAME=your_folder_name
FOLDER_VIDEO=your_video_folder_name
```
Start the backend server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd ../frontend/learn-Right
npm install
```
Create a `.env` file in the `frontend` directory and add the following:
```
VITE_APP_BASE_URL=your_backend_url
VITE_APP_RAZORPAY_KEY=your_razorpay_key
```
Start the frontend server:
```bash
npm run dev
```

## Usage
- Register as a student or instructor.
- Admin can manage categories and monitor platform activity.
- Instructors can create and manage courses.
- Students can enroll in courses, track progress, and leave reviews.
- Secure payments via Razorpay (test mode enabled).

## License
MIT License

---
Developed with ❤️ using the MERN stack.

