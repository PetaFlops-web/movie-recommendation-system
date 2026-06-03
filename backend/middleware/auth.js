// middleware/auth.js
const jwt = require('jsonwebtoken');
const { get } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Format token tidak valid. Gunakan format: Bearer <token>'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists (using sqlite3 promise-based query)
    const user = await get('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Silakan login kembali.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kadaluarsa. Silakan login kembali.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    });
  }
};

module.exports = authMiddleware;