import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Format token tidak valid. Gunakan format: Bearer <token>'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists (PostgreSQL query)
    const result = await query('SELECT id, username, email FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Silakan login kembali.'
      });
    }

    // Attach user to request
    req.user = result.rows[0];
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

export default authMiddleware;