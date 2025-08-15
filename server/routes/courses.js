const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, grade, status, search } = req.query;
    
    const query = {};
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      message: 'Server error while fetching courses',
      error: 'GET_COURSES_ERROR'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName email');

    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
        error: 'COURSE_NOT_FOUND'
      });
    }

    res.json({ course });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      message: 'Server error while fetching course',
      error: 'GET_COURSE_ERROR'
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private/Admin
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('name').notEmpty().withMessage('Course name is required'),
  body('description').notEmpty().withMessage('Course description is required'),
  body('subject').isIn(['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physical Education', 'Arts', 'Music', 'Computer Science', 'Languages', 'Other']).withMessage('Valid subject is required'),
  body('grade').isIn(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']).withMessage('Valid grade is required'),
  body('section').notEmpty().withMessage('Section is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('semester').isIn(['1st', '2nd', '3rd', '4th']).withMessage('Valid semester is required'),
  body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  body('teacherId').isMongoId().withMessage('Valid teacher ID is required'),
  body('enrollment.maxStudents').isInt({ min: 1 }).withMessage('Maximum students must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, subject, grade, section, academicYear, semester, credits, teacherId, schedule, enrollment } = req.body;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found',
        error: 'TEACHER_NOT_FOUND'
      });
    }

    const course = new Course({
      name,
      description,
      subject,
      grade,
      section,
      academicYear,
      semester,
      credits,
      teacher: teacherId,
      schedule,
      enrollment
    });

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName');

    res.status(201).json({
      message: 'Course created successfully',
      course: populatedCourse
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      message: 'Server error while creating course',
      error: 'CREATE_COURSE_ERROR'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('name').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, schedule, enrollment, status } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
        error: 'COURSE_NOT_FOUND'
      });
    }

    // Update fields
    if (name) course.name = name;
    if (description) course.description = description;
    if (schedule) course.schedule = schedule;
    if (enrollment) course.enrollment = { ...course.enrollment, ...enrollment };
    if (status) course.status = status;

    await course.save();

    const updatedCourse = await Course.findById(course._id)
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName');

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      message: 'Server error while updating course',
      error: 'UPDATE_COURSE_ERROR'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
        error: 'COURSE_NOT_FOUND'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      message: 'Server error while deleting course',
      error: 'DELETE_COURSE_ERROR'
    });
  }
});

// @route   GET /api/courses/subject/:subject/grade/:grade
// @desc    Get courses by subject and grade
// @access  Private
router.get('/subject/:subject/grade/:grade', authenticateToken, async (req, res) => {
  try {
    const { subject, grade } = req.params;
    
    const courses = await Course.findBySubjectGrade(subject, grade);

    res.json({ courses });

  } catch (error) {
    console.error('Get courses by subject/grade error:', error);
    res.status(500).json({
      message: 'Server error while fetching courses',
      error: 'GET_COURSES_BY_SUBJECT_GRADE_ERROR'
    });
  }
});

// @route   GET /api/courses/teacher/:teacherId
// @desc    Get courses by teacher
// @access  Private
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const courses = await Course.findByTeacher(teacherId);

    res.json({ courses });

  } catch (error) {
    console.error('Get courses by teacher error:', error);
    res.status(500).json({
      message: 'Server error while fetching courses',
      error: 'GET_COURSES_BY_TEACHER_ERROR'
    });
  }
});

// @route   GET /api/courses/stats/enrollment
// @desc    Get course enrollment statistics
// @access  Private
router.get('/stats/enrollment', authenticateToken, async (req, res) => {
  try {
    const stats = await Course.getEnrollmentStats();

    res.json({ stats: stats[0] || {} });

  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching enrollment statistics',
      error: 'GET_ENROLLMENT_STATS_ERROR'
    });
  }
});

module.exports = router;
