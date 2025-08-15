const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physical Education', 'Arts', 'Music', 'Computer Science', 'Languages', 'Other']
  },
  grade: {
    type: String,
    required: true,
    enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
  },
  section: {
    type: String,
    required: true,
    uppercase: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th'],
    required: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      required: true
    }
  }],
  syllabus: [{
    week: Number,
    topic: String,
    description: String,
    learningObjectives: [String],
    materials: [String],
    assignments: [String]
  }],
  enrollment: {
    maxStudents: {
      type: Number,
      required: true,
      min: 1
    },
    currentEnrollment: {
      type: Number,
      default: 0
    },
    students: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      },
      enrollmentDate: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['enrolled', 'dropped', 'completed'],
        default: 'enrolled'
      }
    }]
  },
  grading: {
    assignments: {
      weight: {
        type: Number,
        default: 30,
        min: 0,
        max: 100
      },
      count: {
        type: Number,
        default: 0
      }
    },
    quizzes: {
      weight: {
        type: Number,
        default: 20,
        min: 0,
        max: 100
      },
      count: {
        type: Number,
        default: 0
      }
    },
    midterm: {
      weight: {
        type: Number,
        default: 25,
        min: 0,
        max: 100
      }
    },
    final: {
      weight: {
        type: Number,
        default: 25,
        min: 0,
        max: 100
      }
    }
  },
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['textbook', 'document', 'video', 'link', 'other']
    },
    url: String,
    description: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  announcements: [{
    title: String,
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    isImportant: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  },
  prerequisites: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    minimumGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'C'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for enrollment percentage
courseSchema.virtual('enrollmentPercentage').get(function() {
  if (this.enrollment.maxStudents === 0) return 0;
  return ((this.enrollment.currentEnrollment / this.enrollment.maxStudents) * 100).toFixed(2);
});

// Virtual for available seats
courseSchema.virtual('availableSeats').get(function() {
  return this.enrollment.maxStudents - this.enrollment.currentEnrollment;
});

// Virtual for course info
courseSchema.virtual('courseInfo').get(function() {
  return {
    courseCode: this.courseCode,
    name: this.name,
    subject: this.subject,
    grade: this.grade,
    section: this.section,
    teacher: this.teacher
  };
});

// Indexes for better query performance
// Note: `courseCode` has a unique index via the field definition
courseSchema.index({ subject: 1 });
courseSchema.index({ grade: 1, section: 1 });
courseSchema.index({ teacher: 1 });
courseSchema.index({ status: 1 });

// Pre-save middleware to generate course code if not provided
courseSchema.pre('save', async function(next) {
  if (!this.courseCode) {
    const subjectCode = this.subject.substring(0, 3).toUpperCase();
    const gradeCode = this.grade.replace(/\D/g, '');
    const sectionCode = this.section;
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.courseCode = `${subjectCode}${gradeCode}${sectionCode}${year}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Method to add student to course
courseSchema.methods.addStudent = function(studentId) {
  if (this.enrollment.currentEnrollment >= this.enrollment.maxStudents) {
    throw new Error('Course is full');
  }
  
  const existingEnrollment = this.enrollment.students.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (existingEnrollment) {
    throw new Error('Student is already enrolled');
  }
  
  this.enrollment.students.push({
    student: studentId,
    enrollmentDate: new Date(),
    status: 'enrolled'
  });
  
  this.enrollment.currentEnrollment += 1;
  return this.save();
};

// Method to remove student from course
courseSchema.methods.removeStudent = function(studentId) {
  const enrollmentIndex = this.enrollment.students.findIndex(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (enrollmentIndex === -1) {
    throw new Error('Student is not enrolled in this course');
  }
  
  this.enrollment.students.splice(enrollmentIndex, 1);
  this.enrollment.currentEnrollment -= 1;
  return this.save();
};

// Static method to find by subject and grade
courseSchema.statics.findBySubjectGrade = function(subject, grade) {
  return this.find({ subject, grade, status: 'active' }).populate('teacher');
};

// Static method to find by teacher
courseSchema.statics.findByTeacher = function(teacherId) {
  return this.find({ teacher: teacherId, status: 'active' });
};

// Static method to get enrollment statistics
courseSchema.statics.getEnrollmentStats = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        totalEnrollment: { $sum: '$enrollment.currentEnrollment' },
        totalCapacity: { $sum: '$enrollment.maxStudents' },
        avgEnrollment: { $avg: '$enrollmentPercentage' }
      }
    }
  ]);
};

module.exports = mongoose.model('Course', courseSchema);
