const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
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
  records: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused', 'suspended'],
      required: true
    },
    timeIn: {
      type: Date
    },
    timeOut: {
      type: Date
    },
    notes: String,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalStudents: {
    type: Number,
    required: true
  },
  presentCount: {
    type: Number,
    default: 0
  },
  absentCount: {
    type: Number,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  },
  excusedCount: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  notes: String,
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for attendance summary
attendanceSchema.virtual('summary').get(function() {
  return {
    date: this.date,
    totalStudents: this.totalStudents,
    present: this.presentCount,
    absent: this.absentCount,
    late: this.lateCount,
    excused: this.excusedCount,
    percentage: this.attendancePercentage
  };
});

// Indexes for better query performance
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ course: 1 });
attendanceSchema.index({ teacher: 1 });
attendanceSchema.index({ 'records.student': 1 });
attendanceSchema.index({ date: 1, course: 1 }, { unique: true });

// Pre-save middleware to calculate attendance statistics
attendanceSchema.pre('save', function(next) {
  if (this.records && this.records.length > 0) {
    this.presentCount = this.records.filter(r => r.status === 'present').length;
    this.absentCount = this.records.filter(r => r.status === 'absent').length;
    this.lateCount = this.records.filter(r => r.status === 'late').length;
    this.excusedCount = this.records.filter(r => r.status === 'excused').length;
    
    const totalMarked = this.presentCount + this.absentCount + this.lateCount + this.excusedCount;
    if (totalMarked > 0) {
      this.attendancePercentage = ((this.presentCount + this.lateCount) / totalMarked * 100).toFixed(2);
    }
  }
  next();
});

// Method to mark attendance for a student
attendanceSchema.methods.markAttendance = function(studentId, status, notes = '') {
  const recordIndex = this.records.findIndex(
    record => record.student.toString() === studentId.toString()
  );
  
  if (recordIndex === -1) {
    throw new Error('Student not found in attendance records');
  }
  
  this.records[recordIndex].status = status;
  this.records[recordIndex].notes = notes;
  this.records[recordIndex].markedAt = new Date();
  
  return this.save();
};

// Method to lock attendance
attendanceSchema.methods.lockAttendance = function(userId) {
  this.isLocked = true;
  this.lockedBy = userId;
  this.lockedAt = new Date();
  return this.save();
};

// Method to unlock attendance
attendanceSchema.methods.unlockAttendance = function() {
  this.isLocked = false;
  this.lockedBy = null;
  this.lockedAt = null;
  return this.save();
};

// Static method to find by date and course
attendanceSchema.statics.findByDateAndCourse = function(date, courseId) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.findOne({
    date: { $gte: startOfDay, $lte: endOfDay },
    course: courseId
  }).populate('records.student').populate('teacher');
};

// Static method to find student attendance for a date range
attendanceSchema.statics.findStudentAttendance = function(studentId, startDate, endDate) {
  return this.find({
    date: { $gte: startDate, $lte: endDate },
    'records.student': studentId
  }).populate('course').populate('teacher');
};

// Static method to get attendance statistics for a course
attendanceSchema.statics.getCourseAttendanceStats = function(courseId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        course: mongoose.Types.ObjectId(courseId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        avgAttendance: { $avg: '$attendancePercentage' },
        totalPresent: { $sum: '$presentCount' },
        totalAbsent: { $sum: '$absentCount' },
        totalLate: { $sum: '$lateCount' },
        totalExcused: { $sum: '$excusedCount' }
      }
    }
  ]);
};

// Static method to get student attendance statistics
attendanceSchema.statics.getStudentAttendanceStats = function(studentId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        'records.student': mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $unwind: '$records'
    },
    {
      $match: {
        'records.student': mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] }
        },
        absentDays: {
          $sum: { $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0] }
        },
        lateDays: {
          $sum: { $cond: [{ $eq: ['$records.status', 'late'] }, 1, 0] }
        },
        excusedDays: {
          $sum: { $cond: [{ $eq: ['$records.status', 'excused'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalDays: 1,
        presentDays: 1,
        absentDays: 1,
        lateDays: 1,
        excusedDays: 1,
        attendancePercentage: {
          $multiply: [
            {
              $divide: [
                { $add: ['$presentDays', '$lateDays'] },
                '$totalDays'
              ]
            },
            100
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
