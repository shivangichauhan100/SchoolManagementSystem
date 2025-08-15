const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-password -passwordResetToken -passwordResetExpires -emailVerificationToken',
      sort: { createdAt: -1 }
    };

    const users = await User.paginate(query, options);

    res.json({
      users: users.docs,
      pagination: {
        page: users.page,
        limit: users.limit,
        totalDocs: users.totalDocs,
        totalPages: users.totalPages,
        hasNextPage: users.hasNextPage,
        hasPrevPage: users.hasPrevPage
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Server error while fetching users',
      error: 'GET_USERS_ERROR'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticateToken, requireOwnershipOrAdmin('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({ user: user.getPublicProfile() });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error while fetching user',
      error: 'GET_USER_ERROR'
    });
  }
});

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private/Admin
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['admin', 'teacher', 'student', 'parent'])
    .withMessage('Invalid role specified'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, role, phone, address, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
        error: 'EMAIL_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      address,
      dateOfBirth,
      gender
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      message: 'Server error while creating user',
      error: 'CREATE_USER_ERROR'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('id'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student', 'parent'])
    .withMessage('Invalid role specified')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, address, dateOfBirth, gender, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    
    // Only admin can change role and active status
    if (req.user.role === 'admin') {
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: 'Server error while updating user',
      error: 'UPDATE_USER_ERROR'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Cannot delete your own account',
        error: 'SELF_DELETE_NOT_ALLOWED'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Server error while deleting user',
      error: 'DELETE_USER_ERROR'
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (admin only)
// @access  Private/Admin
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: ['$isActive', 0, 1] }
          },
          roleDistribution: {
            $push: '$role'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          activeUsers: 1,
          inactiveUsers: 1,
          roleDistribution: 1
        }
      }
    ]);

    // Calculate role distribution
    const roleStats = {};
    if (stats[0] && stats[0].roleDistribution) {
      stats[0].roleDistribution.forEach(role => {
        roleStats[role] = (roleStats[role] || 0) + 1;
      });
    }

    res.json({
      stats: {
        totalUsers: stats[0]?.totalUsers || 0,
        activeUsers: stats[0]?.activeUsers || 0,
        inactiveUsers: stats[0]?.inactiveUsers || 0,
        roleDistribution: roleStats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching user statistics',
      error: 'GET_USER_STATS_ERROR'
    });
  }
});

// @route   GET /api/users/role/:role
// @desc    Get users by role (admin only)
// @access  Private/Admin
router.get('/role/:role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-password -passwordResetToken -passwordResetExpires -emailVerificationToken',
      sort: { createdAt: -1 }
    };

    const users = await User.paginate({ role }, options);

    res.json({
      users: users.docs,
      pagination: {
        page: users.page,
        limit: users.limit,
        totalDocs: users.totalDocs,
        totalPages: users.totalPages,
        hasNextPage: users.hasNextPage,
        hasPrevPage: users.hasPrevPage
      }
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      message: 'Server error while fetching users by role',
      error: 'GET_USERS_BY_ROLE_ERROR'
    });
  }
});

// @route   POST /api/users/:id/deactivate
// @desc    Deactivate user (admin only)
// @access  Private/Admin
router.post('/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Cannot deactivate your own account',
        error: 'SELF_DEACTIVATE_NOT_ALLOWED'
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      message: 'User deactivated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      message: 'Server error while deactivating user',
      error: 'DEACTIVATE_USER_ERROR'
    });
  }
});

// @route   POST /api/users/:id/activate
// @desc    Activate user (admin only)
// @access  Private/Admin
router.post('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      message: 'User activated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      message: 'Server error while activating user',
      error: 'ACTIVATE_USER_ERROR'
    });
  }
});

module.exports = router;
