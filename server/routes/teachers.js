const express = require('express');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, department, status, search } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { teacherId: { $regex: search, $options: 'i' } },
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(query)
      .populate('user', 'firstName lastName email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Teacher.countDocuments(query);

    res.json({
      teachers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      message: 'Server error while fetching teachers',
      error: 'GET_TEACHERS_ERROR'
    });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'firstName lastName email phone address dateOfBirth gender');

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found',
        error: 'TEACHER_NOT_FOUND'
      });
    }

    res.json({ teacher });

  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      message: 'Server error while fetching teacher',
      error: 'GET_TEACHER_ERROR'
    });
  }
});

// @route   POST /api/teachers
// @desc    Create a new teacher
// @access  Private/Admin
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('department').isIn(['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physical Education', 'Arts', 'Music', 'Computer Science', 'Languages', 'Other']).withMessage('Valid department is required'),
  body('subjects').isArray().withMessage('Subjects must be an array'),
  body('salary.basic').isNumeric().withMessage('Basic salary is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, employeeId, department, subjects, qualifications, salary } = req.body;

    // Check if user exists and is a teacher
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'teacher') {
      return res.status(400).json({
        message: 'User must have teacher role',
        error: 'INVALID_USER_ROLE'
      });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ user: userId });
    if (existingTeacher) {
      return res.status(400).json({
        message: 'Teacher profile already exists for this user',
        error: 'TEACHER_EXISTS'
      });
    }

    const teacher = new Teacher({
      user: userId,
      employeeId,
      department,
      subjects,
      qualifications,
      salary
    });

    await teacher.save();

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate('user', 'firstName lastName email phone');

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: populatedTeacher
    });

  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      message: 'Server error while creating teacher',
      error: 'CREATE_TEACHER_ERROR'
    });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('department').optional().isIn(['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physical Education', 'Arts', 'Music', 'Computer Science', 'Languages', 'Other']),
  body('status').optional().isIn(['active', 'inactive', 'on-leave', 'terminated'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { department, subjects, salary, status } = req.body;
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found',
        error: 'TEACHER_NOT_FOUND'
      });
    }

    // Update fields
    if (department) teacher.department = department;
    if (subjects) teacher.subjects = subjects;
    if (salary) teacher.salary = { ...teacher.salary, ...salary };
    if (status) teacher.status = status;

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate('user', 'firstName lastName email phone');

    res.json({
      message: 'Teacher updated successfully',
      teacher: updatedTeacher
    });

  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      message: 'Server error while updating teacher',
      error: 'UPDATE_TEACHER_ERROR'
    });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found',
        error: 'TEACHER_NOT_FOUND'
      });
    }

    await Teacher.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Teacher deleted successfully'
    });

  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      message: 'Server error while deleting teacher',
      error: 'DELETE_TEACHER_ERROR'
    });
  }
});

// @route   GET /api/teachers/department/:department
// @desc    Get teachers by department
// @access  Private
router.get('/department/:department', authenticateToken, async (req, res) => {
  try {
    const { department } = req.params;
    
    const teachers = await Teacher.findByDepartment(department);

    res.json({ teachers });

  } catch (error) {
    console.error('Get teachers by department error:', error);
    res.status(500).json({
      message: 'Server error while fetching teachers',
      error: 'GET_TEACHERS_BY_DEPARTMENT_ERROR'
    });
  }
});

// @route   GET /api/teachers/stats/department
// @desc    Get teacher department statistics
// @access  Private
router.get('/stats/department', authenticateToken, async (req, res) => {
  try {
    const stats = await Teacher.getDepartmentStats();

    res.json({ stats });

  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching department statistics',
      error: 'GET_DEPARTMENT_STATS_ERROR'
    });
  }
});

module.exports = router;
