const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        error: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};


const requireAdmin = requireRole(['admin']);
const requireTeacher = requireRole(['admin', 'teacher']);
const requireStudent = requireRole(['admin', 'teacher', 'student']);
const requireOwnershipOrAdmin = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params[resourceField] || req.body[resourceField];
    
    if (!resourceId) {
      return res.status(400).json({ 
        message: 'Resource ID required',
        error: 'MISSING_RESOURCE_ID'
      });
    }

    if (resourceId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied to this resource',
        error: 'ACCESS_DENIED'
      });
    }

    next();
  };
};

const requireStudentAccess = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }
    if (['admin', 'teacher'].includes(req.user.role)) {
      return next();
    }
    if (req.user.role === 'student') {
      const studentId = req.params.studentId || req.body.studentId;
      
      if (!studentId) {
        return res.status(400).json({ 
          message: 'Student ID required',
          error: 'MISSING_STUDENT_ID'
        });
      }
      return next();
    }

    return res.status(403).json({ 
      message: 'Insufficient permissions to access student data',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
  };
};


const requireCourseAccess = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.role === 'teacher') {
      return next();
    }
    if (req.user.role === 'student') {
      
      return next();
    }

    return res.status(403).json({ 
      message: 'Insufficient permissions to access course data',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireOwnershipOrAdmin,
  requireStudentAccess,
  requireCourseAccess,
  optionalAuth
};
