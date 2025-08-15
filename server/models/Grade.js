const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
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
  assignments: [{
    title: String,
    maxScore: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      default: 1
    },
    dueDate: Date,
    submittedDate: Date,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
      type: Date,
      default: Date.now
    }
  }],
  quizzes: [{
    title: String,
    maxScore: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      default: 1
    },
    date: Date,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
      type: Date,
      default: Date.now
    }
  }],
  midterm: {
    maxScore: {
      type: Number,
      required: true
    },
    score: {
      type: Number
    },
    date: Date,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date
  },
  final: {
    maxScore: {
      type: Number,
      required: true
    },
    score: {
      type: Number
    },
    date: Date,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date
  },
  participation: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    maxScore: {
      type: Number,
      default: 100
    },
    comments: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date
  },
  attendance: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    maxScore: {
      type: Number,
      default: 100
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  finalGrade: {
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    letterGrade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W']
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4.0
    }
  },
  comments: String,
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for assignment average
gradeSchema.virtual('assignmentAverage').get(function() {
  if (!this.assignments || this.assignments.length === 0) return 0;
  
  const totalScore = this.assignments.reduce((sum, assignment) => {
    return sum + (assignment.score / assignment.maxScore) * assignment.weight;
  }, 0);
  
  const totalWeight = this.assignments.reduce((sum, assignment) => {
    return sum + assignment.weight;
  }, 0);
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
});

// Virtual for quiz average
gradeSchema.virtual('quizAverage').get(function() {
  if (!this.quizzes || this.quizzes.length === 0) return 0;
  
  const totalScore = this.quizzes.reduce((sum, quiz) => {
    return sum + (quiz.score / quiz.maxScore) * quiz.weight;
  }, 0);
  
  const totalWeight = this.quizzes.reduce((sum, quiz) => {
    return sum + quiz.weight;
  }, 0);
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
});

// Virtual for overall grade calculation
gradeSchema.virtual('calculatedGrade').get(function() {
  let totalScore = 0;
  let totalWeight = 0;
  
  // Assignment grade
  if (this.assignments && this.assignments.length > 0) {
    const assignmentWeight = 30; // Default weight
    totalScore += (this.assignmentAverage / 100) * assignmentWeight;
    totalWeight += assignmentWeight;
  }
  
  // Quiz grade
  if (this.quizzes && this.quizzes.length > 0) {
    const quizWeight = 20; // Default weight
    totalScore += (this.quizAverage / 100) * quizWeight;
    totalWeight += quizWeight;
  }
  
  // Midterm grade
  if (this.midterm && this.midterm.score !== undefined) {
    const midtermWeight = 25; // Default weight
    const midtermPercentage = (this.midterm.score / this.midterm.maxScore) * 100;
    totalScore += (midtermPercentage / 100) * midtermWeight;
    totalWeight += midtermWeight;
  }
  
  // Final grade
  if (this.final && this.final.score !== undefined) {
    const finalWeight = 25; // Default weight
    const finalPercentage = (this.final.score / this.final.maxScore) * 100;
    totalScore += (finalPercentage / 100) * finalWeight;
    totalWeight += finalWeight;
  }
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
});

// Virtual for letter grade conversion
gradeSchema.virtual('letterGradeFromPercentage').get(function() {
  const percentage = this.calculatedGrade;
  
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
});

// Virtual for GPA conversion
gradeSchema.virtual('gpaFromLetter').get(function() {
  const letterGrade = this.letterGradeFromPercentage;
  
  const gpaMap = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  
  return gpaMap[letterGrade] || 0.0;
});

// Indexes for better query performance
gradeSchema.index({ student: 1 });
gradeSchema.index({ course: 1 });
gradeSchema.index({ teacher: 1 });
gradeSchema.index({ academicYear: 1, semester: 1 });
gradeSchema.index({ student: 1, course: 1, academicYear: 1, semester: 1 }, { unique: true });

// Pre-save middleware to update final grade
gradeSchema.pre('save', function(next) {
  this.finalGrade.percentage = this.calculatedGrade;
  this.finalGrade.letterGrade = this.letterGradeFromPercentage;
  this.finalGrade.gpa = this.gpaFromLetter;
  this.lastUpdated = new Date();
  next();
});

// Method to add assignment
gradeSchema.methods.addAssignment = function(assignmentData) {
  this.assignments.push(assignmentData);
  return this.save();
};

// Method to add quiz
gradeSchema.methods.addQuiz = function(quizData) {
  this.quizzes.push(quizData);
  return this.save();
};

// Method to update midterm
gradeSchema.methods.updateMidterm = function(midtermData) {
  this.midterm = { ...this.midterm, ...midtermData };
  return this.save();
};

// Method to update final
gradeSchema.methods.updateFinal = function(finalData) {
  this.final = { ...this.final, ...finalData };
  return this.save();
};

// Method to publish grades
gradeSchema.methods.publishGrades = function(userId) {
  this.isPublished = true;
  this.publishedAt = new Date();
  this.publishedBy = userId;
  return this.save();
};

// Static method to find student grades
gradeSchema.statics.findStudentGrades = function(studentId, academicYear, semester) {
  const query = { student: studentId };
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = semester;
  
  return this.find(query).populate('course').populate('teacher');
};

// Static method to find course grades
gradeSchema.statics.findCourseGrades = function(courseId, academicYear, semester) {
  const query = { course: courseId };
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = semester;
  
  return this.find(query).populate('student').populate('teacher');
};

// Static method to get grade statistics
gradeSchema.statics.getGradeStats = function(courseId, academicYear, semester) {
  return this.aggregate([
    {
      $match: {
        course: mongoose.Types.ObjectId(courseId),
        academicYear: academicYear,
        semester: semester
      }
    },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        avgGrade: { $avg: '$finalGrade.percentage' },
        avgGPA: { $avg: '$finalGrade.gpa' },
        gradeDistribution: {
          $push: '$finalGrade.letterGrade'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Grade', gradeSchema);
