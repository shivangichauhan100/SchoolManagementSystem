const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { authenticateToken, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, date, startDate, endDate } = req.query;
    
    const query = {};
    if (courseId) query.course = courseId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      message: 'Server error while fetching attendance',
      error: 'GET_ATTENDANCE_ERROR'
    });
  }
});

// @route   GET /api/attendance/:id
// @desc    Get attendance by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName')
      .populate('records.student', 'studentId')
      .populate('records.student.user', 'firstName lastName');

    if (!attendance) {
      return res.status(404).json({
        message: 'Attendance record not found',
        error: 'ATTENDANCE_NOT_FOUND'
      });
    }

    res.json({ attendance });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      message: 'Server error while fetching attendance',
      error: 'GET_ATTENDANCE_ERROR'
    });
  }
});

// @route   POST /api/attendance
// @desc    Create attendance record
// @access  Private/Teacher
router.post('/', [
  authenticateToken,
  requireTeacher,
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray().withMessage('Records must be an array'),
  body('records.*.studentId').isMongoId().withMessage('Valid student ID is required'),
  body('records.*.status').isIn(['present', 'absent', 'late', 'excused', 'suspended']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId, date, records, notes } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
        error: 'COURSE_NOT_FOUND'
      });
    }

    // Check if attendance already exists for this date and course
    const existingAttendance = await Attendance.findByDateAndCourse(date, courseId);
    if (existingAttendance) {
      return res.status(400).json({
        message: 'Attendance already marked for this date and course',
        error: 'ATTENDANCE_EXISTS'
      });
    }

    const attendance = new Attendance({
      date: new Date(date),
      course: courseId,
      teacher: req.user._id,
      records: records.map(record => ({
        student: record.studentId,
        status: record.status,
        notes: record.notes,
        markedBy: req.user._id
      })),
      totalStudents: records.length,
      notes
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName')
      .populate('records.student', 'studentId')
      .populate('records.student.user', 'firstName lastName');

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: populatedAttendance
    });

  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({
      message: 'Server error while marking attendance',
      error: 'CREATE_ATTENDANCE_ERROR'
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private/Teacher
router.put('/:id', [
  authenticateToken,
  requireTeacher,
  body('records.*.status').optional().isIn(['present', 'absent', 'late', 'excused', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { records, notes } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        message: 'Attendance record not found',
        error: 'ATTENDANCE_NOT_FOUND'
      });
    }

    // Check if attendance is locked
    if (attendance.isLocked) {
      return res.status(400).json({
        message: 'Attendance record is locked and cannot be modified',
        error: 'ATTENDANCE_LOCKED'
      });
    }

    // Update records
    if (records) {
      records.forEach(updateRecord => {
        const recordIndex = attendance.records.findIndex(
          record => record.student.toString() === updateRecord.studentId
        );
        if (recordIndex !== -1) {
          attendance.records[recordIndex].status = updateRecord.status;
          if (updateRecord.notes) {
            attendance.records[recordIndex].notes = updateRecord.notes;
          }
          attendance.records[recordIndex].markedAt = new Date();
        }
      });
    }

    if (notes) attendance.notes = notes;

    await attendance.save();

    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName')
      .populate('records.student', 'studentId')
      .populate('records.student.user', 'firstName lastName');

    res.json({
      message: 'Attendance updated successfully',
      attendance: updatedAttendance
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      message: 'Server error while updating attendance',
      error: 'UPDATE_ATTENDANCE_ERROR'
    });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get student attendance
// @access  Private
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.findStudentAttendance(studentId, start, end);

    res.json({ attendance });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      message: 'Server error while fetching student attendance',
      error: 'GET_STUDENT_ATTENDANCE_ERROR'
    });
  }
});

// @route   GET /api/attendance/course/:courseId/stats
// @desc    Get course attendance statistics
// @access  Private
router.get('/course/:courseId/stats', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Attendance.getCourseAttendanceStats(courseId, start, end);

    res.json({ stats: stats[0] || {} });

  } catch (error) {
    console.error('Get course attendance stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching course attendance statistics',
      error: 'GET_COURSE_ATTENDANCE_STATS_ERROR'
    });
  }
});

// @route   GET /api/attendance/student/:studentId/stats
// @desc    Get student attendance statistics
// @access  Private
router.get('/student/:studentId/stats', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Attendance.getStudentAttendanceStats(studentId, start, end);

    res.json({ stats: stats[0] || {} });

  } catch (error) {
    console.error('Get student attendance stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching student attendance statistics',
      error: 'GET_STUDENT_ATTENDANCE_STATS_ERROR'
    });
  }
});

// @route   POST /api/attendance/:id/lock
// @desc    Lock attendance record
// @access  Private/Teacher
router.post('/:id/lock', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        message: 'Attendance record not found',
        error: 'ATTENDANCE_NOT_FOUND'
      });
    }

    await attendance.lockAttendance(req.user._id);

    res.json({
      message: 'Attendance record locked successfully'
    });

  } catch (error) {
    console.error('Lock attendance error:', error);
    res.status(500).json({
      message: 'Server error while locking attendance',
      error: 'LOCK_ATTENDANCE_ERROR'
    });
  }
});

// @route   POST /api/attendance/:id/unlock
// @desc    Unlock attendance record
// @access  Private/Teacher
router.post('/:id/unlock', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        message: 'Attendance record not found',
        error: 'ATTENDANCE_NOT_FOUND'
      });
    }

    await attendance.unlockAttendance();

    res.json({
      message: 'Attendance record unlocked successfully'
    });

  } catch (error) {
    console.error('Unlock attendance error:', error);
    res.status(500).json({
      message: 'Server error while unlocking attendance',
      error: 'UNLOCK_ATTENDANCE_ERROR'
    });
  }
});

module.exports = router;
