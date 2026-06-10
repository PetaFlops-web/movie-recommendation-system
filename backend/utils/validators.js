import { body, param, query } from 'express-validator';

// Validation rules for registration
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus antara 3-50 karakter')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username hanya boleh mengandung huruf, angka, dan underscore'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format email tidak valid')
    .isLength({ max: 100 })
    .withMessage('Email terlalu panjang'),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password harus minimal 6 karakter')
    .matches(/\d/)
    .withMessage('Password harus mengandung minimal 1 angka'),
  
  body('genres')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Genres harus berupa array')
];

// Validation rules for login
export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format email tidak valid'),
  
  body('password')
    .notEmpty()
    .withMessage('Password harus diisi')
];

// Validation rules for preferences
export const preferencesValidation = [
  body('genres')
    .isArray({ min: 1, max: 20 })
    .withMessage('Pilih minimal 1 dan maksimal 20 genre')
    .custom((genres) => {
      if (!genres.every(g => typeof g === 'string' && g.trim().length > 0)) {
        throw new Error('Setiap genre harus berupa string yang valid');
      }
      return true;
    })
];

// Validation rules for movie ID
export const movieIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID film harus berupa angka positif')
];

// Validation rules for query parameters
export const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Pencarian terlalu panjang'),
  
  query('genre')
    .optional()
    .trim(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus lebih dari 0')
];

/**
 * Validate comment content
 * @param {string} text - Comment text to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export const validateComment = (text) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: 'Komentar tidak boleh kosong' };
  }
  if (text.trim().length < 10) {
    return { valid: false, message: 'Komentar terlalu pendek (min. 10 karakter)' };
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    return { valid: false, message: 'Komentar tidak boleh mengandung link' };
  }

  const chars = text.match(/[a-zA-Z]/g);
  if (chars) {
    const upperCount = chars.filter(c => c === c.toUpperCase()).length;
    const ratio = upperCount / chars.length;
    if (ratio > 0.8 && text.length > 10) {
      return { valid: false, message: 'Mohon jangan gunakan Capslock berlebihan' };
    }
  }

  if (/(.)\1{4,}/.test(text)) {
    return { valid: false, message: 'Terdeteksi spam karakter berulang' };
  }

  const toxicWords = ['bodoh', 'goblok', 'anjing', 'babi', 'stupid', 'idiot', 'tolol', 'bangsat', 'jelek banget', 'buruk'];
  const lowerText = text.toLowerCase();
  const foundToxic = toxicWords.find(word => lowerText.includes(word));
  
  if (foundToxic) {
    return { valid: false, message: 'Komentar mengandung kata yang tidak pantas' };
  }

  return { valid: true, message: 'Komentar aman' };
};