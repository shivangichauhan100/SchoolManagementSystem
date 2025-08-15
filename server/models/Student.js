const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
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
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true
  },
  parent: {
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other'],
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    occupation: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  medicalInfo: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    medicalConditions: [String],
    medications: [String]
  },
  academicInfo: {
    previousSchool: String,
    transferDate: Date,
    gpa: {
      type: Number,
      min: 0,
      max: 4.0
    },
    classRank: Number,
    totalStudents: Number
  },
  extracurricular: [{
    activity: String,
    role: String,
    achievements: [String]
  }],
  attendance: {
    totalDays: {
      type: Number,
      default: 0
    },
    presentDays: {
      type: Number,
      default: 0
    },
    absentDays: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'graduated', 'transferred'],
    default: 'active'
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for attendance percentage
studentSchema.virtual('attendancePercentage').get(function() {
  if (this.attendance.totalDays === 0) return 0;
  return ((this.attendance.presentDays / this.attendance.totalDays) * 100).toFixed(2);
});

// Virtual for full student info
studentSchema.virtual('fullInfo').get(function() {
  return {
    studentId: this.studentId,
    name: this.user ? `${this.user.firstName} ${this.user.lastName}` : 'N/A',
    grade: this.grade,
    section: this.section,
    status: this.status
  };
});

// Indexes for better query performance
// Note: `studentId` has a unique index via the schema field definition
studentSchema.index({ grade: 1, section: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ 'parent.email': 1 });

// Pre-save middleware to generate student ID if not provided
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.studentId = `STU${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static method to find by grade and section
studentSchema.statics.findByGradeSection = function(grade, section) {
  return this.find({ grade, section, status: 'active' }).populate('user');
};

// Static method to find active students
studentSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).populate('user');
};

// Static method to get attendance statistics
studentSchema.statics.getAttendanceStats = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        avgAttendance: { $avg: '$attendancePercentage' },
        totalPresentDays: { $sum: '$attendance.presentDays' },
        totalAbsentDays: { $sum: '$attendance.absentDays' }
      }
    }
  ]);
};

module.exports = mongoose.model('Student', studentSchema);
