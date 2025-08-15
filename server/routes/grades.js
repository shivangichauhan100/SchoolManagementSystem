const express = require('express');
const { body, validationResult } = require('express-validator');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Student = require('../models/Student');
const { authenticateToken, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/grades
// @desc    Get all grades
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, studentId, academicYear, semester } = req.query;
    
    const query = {};
    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const grades = await Grade.find(query)
      .populate('student', 'studentId')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Grade.countDocuments(query);

    res.json({
      grades,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({
      message: 'Server error while fetching grades',
      error: 'GET_GRADES_ERROR'
    });
  }
});

// @route   GET /api/grades/:id
// @desc    Get grade by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'studentId')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName');

    if (!grade) {
      return res.status(404).json({
        message: 'Grade not found',
        error: 'GRADE_NOT_FOUND'
      });
    }

    res.json({ grade });

  } catch (error) {
    console.error('Get grade error:', error);
    res.status(500).json({
      message: 'Server error while fetching grade',
      error: 'GET_GRADE_ERROR'
    });
  }
});

// @route   POST /api/grades
// @desc    Create a new grade record
// @access  Private/Teacher
router.post('/', [
  authenticateToken,
  requireTeacher,
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('semester').isIn(['1st', '2nd', '3rd', '4th']).withMessage('Valid semester is required'),
  body('midterm.maxScore').isNumeric().withMessage('Midterm max score is required'),
  body('final.maxScore').isNumeric().withMessage('Final max score is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { studentId, courseId, academicYear, semester, midterm, final, assignments, quizzes, participation, attendance } = req.body;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: 'Student not found',
        error: 'STUDENT_NOT_FOUND'
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
        error: 'COURSE_NOT_FOUND'
      });
    }

    // Check if grade already exists for this student, course, and semester
    const existingGrade = await Grade.findOne({
      student: studentId,
      course: courseId,
      academicYear,
      semester
    });

    if (existingGrade) {
      return res.status(400).json({
        message: 'Grade record already exists for this student, course, and semester',
        error: 'GRADE_EXISTS'
      });
    }

    const grade = new Grade({
      student: studentId,
      course: courseId,
      teacher: req.user._id,
      academicYear,
      semester,
      assignments,
      quizzes,
      midterm,
      final,
      participation,
      attendance
    });

    await grade.save();

    const populatedGrade = await Grade.findById(grade._id)
      .populate('student', 'studentId')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName');

    res.status(201).json({
      message: 'Grade record created successfully',
      grade: populatedGrade
    });

  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({
      message: 'Server error while creating grade',
      error: 'CREATE_GRADE_ERROR'
    });
  }
});

// @route   PUT /api/grades/:id
// @desc    Update grade record
// @access  Private/Teacher
router.put('/:id', [
  authenticateToken,
  requireTeacher
], async (req, res) => {
  try {
    const { assignments, quizzes, midterm, final, participation, attendance, comments } = req.body;
    
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({
        message: 'Grade record not found',
        error: 'GRADE_NOT_FOUND'
      });
    }

    // Check if grade is published
    if (grade.isPublished) {
      return res.status(400).json({
        message: 'Cannot modify published grades',
        error: 'GRADE_PUBLISHED'
      });
    }

    // Update fields
    if (assignments) grade.assignments = assignments;
    if (quizzes) grade.quizzes = quizzes;
    if (midterm) grade.midterm = { ...grade.midterm, ...midterm };
    if (final) grade.final = { ...grade.final, ...final };
    if (participation) grade.participation = { ...grade.participation, ...participation };
    if (attendance) grade.attendance = { ...grade.attendance, ...attendance };
    if (comments) grade.comments = comments;

    await grade.save();

    const updatedGrade = await Grade.findById(grade._id)
      .populate('student', 'studentId')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name courseCode')
      .populate('teacher', 'teacherId')
      .populate('teacher.user', 'firstName lastName');

    res.json({
      message: 'Grade updated successfully',
      grade: updatedGrade
    });

  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({
      message: 'Server error while updating grade',
      error: 'UPDATE_GRADE_ERROR'
    });
  }
});

// @route   GET /api/grades/student/:studentId
// @desc    Get student grades
// @access  Private
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester } = req.query;

    const grades = await Grade.findStudentGrades(studentId, academicYear, semester);

    res.json({ grades });

  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({
      message: 'Server error while fetching student grades',
      error: 'GET_STUDENT_GRADES_ERROR'
    });
  }
});

// @route   GET /api/grades/course/:courseId
// @desc    Get course grades
// @access  Private
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { academicYear, semester } = req.query;

    const grades = await Grade.findCourseGrades(courseId, academicYear, semester);

    res.json({ grades });

  } catch (error) {
    console.error('Get course grades error:', error);
    res.status(500).json({
      message: 'Server error while fetching course grades',
      error: 'GET_COURSE_GRADES_ERROR'
    });
  }
});

// @route   GET /api/grades/course/:courseId/stats
// @desc    Get course grade statistics
// @access  Private
router.get('/course/:courseId/stats', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { academicYear, semester } = req.query;

    const stats = await Grade.getGradeStats(courseId, academicYear, semester);

    res.json({ stats: stats[0] || {} });

  } catch (error) {
    console.error('Get course grade stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching course grade statistics',
      error: 'GET_COURSE_GRADE_STATS_ERROR'
    });
  }
});

// @route   POST /api/grades/:id/publish
// @desc    Publish grades
// @access  Private/Teacher
router.post('/:id/publish', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    
    if (!grade) {
      return res.status(404).json({
        message: 'Grade record not found',
        error: 'GRADE_NOT_FOUND'
      });
    }

    await grade.publishGrades(req.user._id);

    res.json({
      message: 'Grades published successfully'
    });

  } catch (error) {
    console.error('Publish grades error:', error);
    res.status(500).json({
      message: 'Server error while publishing grades',
      error: 'PUBLISH_GRADES_ERROR'
    });
  }
});

// @route   POST /api/grades/:id/assignments
// @desc    Add assignment to grade
// @access  Private/Teacher
router.post('/:id/assignments', [
  authenticateToken,
  requireTeacher,
  body('title').notEmpty().withMessage('Assignment title is required'),
  body('maxScore').isNumeric().withMessage('Max score is required'),
  body('score').isNumeric().withMessage('Score is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, maxScore, score, weight, dueDate, feedback } = req.body;
    
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({
        message: 'Grade record not found',
        error: 'GRADE_NOT_FOUND'
      });
    }

    if (grade.isPublished) {
      return res.status(400).json({
        message: 'Cannot modify published grades',
        error: 'GRADE_PUBLISHED'
      });
    }

    await grade.addAssignment({
      title,
      maxScore,
      score,
      weight,
      dueDate,
      feedback,
      gradedBy: req.user._id
    });

    const updatedGrade = await Grade.findById(grade._id)
      .populate('student', 'studentId')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name courseCode');

    res.json({
      message: 'Assignment added successfully',
      grade: updatedGrade
    });

  } catch (error) {
    console.error('Add assignment error:', error);
    res.status(500).json({
      message: 'Server error while adding assignment',
      error: 'ADD_ASSIGNMENT_ERROR'
    });
  }
});

// @route   POST /api/grades/:id/quizzes
// @desc    Add quiz to grade
// @access  Private/Teacher
router.post('/:id/quizzes', [
  authenticateToken,
  requireTeacher,
  body('title').notEmpty().withMessage('Quiz title is required'),
  body('maxScore').isNumeric().withMessage('Max score is required'),
  body('score').isNumeric().withMessage('Score is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, maxScore, score, weight, date, feedback } = req.body;
    
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({
        message: 'Grade record not found',
        error: 'GRADE_NOT_FOUND'
      });
    }

    if (grade.isPublished) {
      return res.status(400).json({
        message: 'Cannot modify published grades',
        error: 'GRADE_PUBLISHED'
      });
    }

    await grade.addQuiz({
      title,
      maxScore,
      score,
      weight,
      date,
      feedback,
      gradedBy: req.user._id
    });

    const updatedGrade = await Grade.findById(grade._id)
      .populate('student', 'studentId')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name courseCode');

    res.json({
      message: 'Quiz added successfully',
      grade: updatedGrade
    });

  } catch (error) {
    console.error('Add quiz error:', error);
    res.status(500).json({
      message: 'Server error while adding quiz',
      error: 'ADD_QUIZ_ERROR'
    });
  }
});

module.exports = router;
