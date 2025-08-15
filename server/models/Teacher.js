const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  teacherId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  department: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physical Education', 'Arts', 'Music', 'Computer Science', 'Languages', 'Other']
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    grade: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    specialization: String
  }],
  experience: {
    totalYears: {
      type: Number,
      default: 0
    },
    previousSchools: [{
      name: String,
      position: String,
      duration: String,
      from: Date,
      to: Date
    }]
  },
  contactInfo: {
    officePhone: String,
    extension: String,
    officeLocation: String,
    officeHours: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String,
      endTime: String
    }]
  },
  salary: {
    basic: {
      type: Number,
      required: true
    },
    allowances: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    reviews: [{
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      date: {
        type: Date,
        default: Date.now
      }
    }],
    achievements: [{
      title: String,
      description: String,
      date: Date,
      category: {
        type: String,
        enum: ['academic', 'professional', 'community', 'other']
      }
    }]
  },
  classes: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'substitute'],
      default: 'primary'
    },
    academicYear: String
  }],
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    leaveBalance: {
      sick: {
        type: Number,
        default: 10
      },
      casual: {
        type: Number,
        default: 15
      },
      annual: {
        type: Number,
        default: 20
      }
    },
    leaves: [{
      type: {
        type: String,
        enum: ['sick', 'casual', 'annual', 'other']
      },
      from: Date,
      to: Date,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave', 'terminated'],
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
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full teacher info
teacherSchema.virtual('fullInfo').get(function() {
  return {
    teacherId: this.teacherId,
    name: this.user ? `${this.user.firstName} ${this.user.lastName}` : 'N/A',
    department: this.department,
    status: this.status
  };
});

// Virtual for primary subjects
teacherSchema.virtual('primarySubjects').get(function() {
  return this.subjects.filter(subject => subject.isPrimary);
});

// Virtual for total experience
teacherSchema.virtual('totalExperience').get(function() {
  const currentYear = new Date().getFullYear();
  const hireYear = this.hireDate.getFullYear();
  return currentYear - hireYear + this.experience.totalYears;
});

// Indexes for better query performance
// Note: `teacherId` and `employeeId` have unique indexes via field definitions
teacherSchema.index({ department: 1 });
teacherSchema.index({ status: 1 });

// Pre-save middleware to generate teacher ID if not provided
teacherSchema.pre('save', async function(next) {
  if (!this.teacherId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.teacherId = `TCH${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static method to find by department
teacherSchema.statics.findByDepartment = function(department) {
  return this.find({ department, status: 'active' }).populate('user');
};

// Static method to find active teachers
teacherSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).populate('user');
};

// Static method to find by subject
teacherSchema.statics.findBySubject = function(subjectName) {
  return this.find({
    'subjects.name': subjectName,
    status: 'active'
  }).populate('user');
};

// Static method to get department statistics
teacherSchema.statics.getDepartmentStats = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgRating: { $avg: '$performance.rating' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Teacher', teacherSchema);
