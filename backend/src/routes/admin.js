const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only certain file types
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document and image files are allowed'));
    }
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics (admin only)
 */
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const stats = await User.getStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics.'
    });
  }
});

/**
 * GET /api/admin/students
 * Get all students with optional filters
 */
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const { role, college, regulation, search, page = 1, limit = 50 } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (college) filters.college = college;
    if (regulation) filters.regulation = regulation;
    if (search) filters.search = search;

    const students = await User.findAll(filters);

    return res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch students.'
    });
  }
});

/**
 * GET /api/admin/students/:id
 * Get single student by ID
 */
router.get('/students/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Remove password hash from response
    delete student.password_hash;

    return res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student.'
    });
  }
});

/**
 * PUT /api/admin/students/:id
 * Update student (admin only)
 */
router.put('/students/:id', protect, adminOnly, validate(require('../middleware/validation').updateProfileSchema), async (req, res) => {
  try {
    const { name, college, regulation, role } = req.body;

    // Check if user exists
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (college !== undefined) updates.college = college;
    if (regulation !== undefined) updates.regulation = regulation;
    if (role !== undefined) updates.role = role;

    const user = await User.updateProfile(req.params.id, updates);

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully.',
      student: user
    });
  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student.'
    });
  }
});

/**
 * DELETE /api/admin/students/:id
 * Delete student (admin only)
 */
router.delete('/students/:id', protect, adminOnly, async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account.'
      });
    }

    const deleted = await User.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully.'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete student.'
    });
  }
});

/**
 * POST /api/admin/upload
 * Upload materials (admin only)
 */
router.post('/upload', protect, adminOnly, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    const { title, course, branch, description } = req.body;

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`,
      title: title || req.file.originalname,
      course,
      branch,
      description: description || '',
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString()
    };

    // TODO: In production, save file info to a separate 'materials' table
    // For now, just return the file info

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file.'
    });
  }
});

module.exports = router;