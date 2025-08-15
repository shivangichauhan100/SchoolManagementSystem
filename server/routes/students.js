const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, grade, section, status, search } = req.query;
    
    const query = {};
    if (grade) query.grade = grade;
    if (section) query.section = section;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('user', 'firstName lastName email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      message: 'Server error while fetching students',
      error: 'GET_STUDENTS_ERROR'
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'firstName lastName email phone address dateOfBirth gender');

    if (!student) {
      return res.status(404).json({
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    res.json({ student });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      message: 'Server error while fetching student',
      error: 'GET_STUDENT_ERROR'
    });
  }
});

// @route   POST /api/students
// @desc    Create a new student
// @access  Private/Admin
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('grade').isIn(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']).withMessage('Valid grade is required'),
  body('section').notEmpty().withMessage('Section is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('parent.name').notEmpty().withMessage('Parent name is required'),
  body('parent.phone').notEmpty().withMessage('Parent phone is required'),
  body('parent.email').isEmail().withMessage('Valid parent email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, grade, section, academicYear, parent, emergencyContact, medicalInfo } = req.body;

    // Check if user exists and is a student
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'student') {
      return res.status(400).json({
        message: 'User must have student role',
        error: 'INVALID_USER_ROLE'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ user: userId });
    if (existingStudent) {
      return res.status(400).json({
        message: 'Student profile already exists for this user',
        error: 'STUDENT_EXISTS'
      });
    }

    const student = new Student({
      user: userId,
      grade,
      section,
      academicYear,
      parent,
      emergencyContact,
      medicalInfo
    });

    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'firstName lastName email phone');

    res.status(201).json({
      message: 'Student created successfully',
      student: populatedStudent
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      message: 'Server error while creating student',
      error: 'CREATE_STUDENT_ERROR'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('grade').optional().isIn(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']),
  body('section').optional().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'graduated', 'transferred'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { grade, section, status, parent, emergencyContact, medicalInfo } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    // Update fields
    if (grade) student.grade = grade;
    if (section) student.section = section;
    if (status) student.status = status;
    if (parent) student.parent = { ...student.parent, ...parent };
    if (emergencyContact) student.emergencyContact = emergencyContact;
    if (medicalInfo) student.medicalInfo = { ...student.medicalInfo, ...medicalInfo };

    await student.save();

    const updatedStudent = await Student.findById(student._id)
      .populate('user', 'firstName lastName email phone');

    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      message: 'Server error while updating student',
      error: 'UPDATE_STUDENT_ERROR'
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      message: 'Server error while deleting student',
      error: 'DELETE_STUDENT_ERROR'
    });
  }
});

// @route   GET /api/students/grade/:grade/section/:section
// @desc    Get students by grade and section
// @access  Private
router.get('/grade/:grade/section/:section', authenticateToken, async (req, res) => {
  try {
    const { grade, section } = req.params;
    
    const students = await Student.findByGradeSection(grade, section);

    res.json({ students });

  } catch (error) {
    console.error('Get students by grade/section error:', error);
    res.status(500).json({
      message: 'Server error while fetching students',
      error: 'GET_STUDENTS_BY_GRADE_SECTION_ERROR'
    });
  }
});

// @route   GET /api/students/stats/attendance
// @desc    Get student attendance statistics
// @access  Private
router.get('/stats/attendance', authenticateToken, async (req, res) => {
  try {
    const stats = await Student.getAttendanceStats();

    res.json({ stats: stats[0] || {} });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching attendance statistics',
      error: 'GET_ATTENDANCE_STATS_ERROR'
    });
  }
});

module.exports = router;
