# School Management System

A comprehensive and modern School Management System built with Next.js, Express.js, and MongoDB. This application provides a complete solution for managing educational institutions with features for students, teachers, administrators, and parents.

 Features

### Core Features
- **User Authentication & Authorization**
  - Role-based access control (Admin, Teacher, Student, Parent)
  - JWT token-based authentication
  - Secure password hashing

- **Student Management**
  - Student registration and profiles
  - Academic records and transcripts
  - Attendance tracking
  - Performance analytics

- **Teacher Management**
  - Teacher profiles and assignments
  - Class and subject management
  - Grade submission
  - Attendance marking

- **Course Management**
  - Course creation and scheduling
  - Subject management
  - Class assignments
  - Syllabus management

- **Attendance System**
  - Daily attendance tracking
  - Attendance reports
  - Automated notifications

- **Grade Management**
  - Grade submission and tracking
  - Report card generation
  - Performance analytics

- **Communication System**
  - Internal messaging
  - Announcements
  - Parent notifications

##  Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI components
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Lucide React** - Icons

### Backend
- **Express.js** - Node.js web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Project Structure

```
school-management-system/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities and configurations
│   ├── types/            # TypeScript type definitions
│   └── public/           # Static assets
├── server/               # Express.js backend
│   ├── controllers/      # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
└── docs/                # Documentation
```

##  Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create `.env` files in both `client/` and `server/` directories:
   
   **server/.env:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/school_management
   JWT_SECRET=your_jwt_secret_here
   NODE_ENV=development
   ```
   
   **client/.env.local:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the frontend (http://localhost:3000) and backend (http://localhost:5000) servers.

##  Database Schema

### Users Collection
- Admin, Teacher, Student, Parent roles
- Authentication details
- Profile information

### Students Collection
- Personal information
- Academic records
- Parent/Guardian details

### Teachers Collection
- Professional information
- Subject specializations
- Class assignments

### Courses Collection
- Course details
- Subject information
- Class schedules

### Attendance Collection
- Daily attendance records
- Student attendance tracking

### Grades Collection
- Academic performance
- Grade submissions

##  Authentication & Authorization

The system implements role-based access control with the following roles:

- **Admin**: Full system access
- **Teacher**: Class management, grade submission, attendance
- **Student**: View grades, attendance, courses
- **Parent**: View child's academic progress

##  UI/UX Features

- **Responsive Design**: Works on all devices
- **Dark/Light Mode**: Toggleable theme
- **Modern Interface**: Clean and intuitive design
- **Real-time Updates**: Live data synchronization
- **Accessibility**: WCAG compliant

##  API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create teacher
- `GET /api/teachers/:id` - Get teacher details

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/:studentId` - Get student attendance

### Grades
- `GET /api/grades` - Get all grades
- `POST /api/grades` - Submit grades
- `GET /api/grades/:studentId` - Get student grades

##  Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Backend (Railway/Heroku)
1. Set up MongoDB Atlas
2. Configure environment variables
3. Deploy the server

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

##  License

This project is licensed under the MIT License.

##  Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with  for better education management**
# SchoolManagementSystem
