const { body, param, query } = require('express-validator');

// Validation rules for registration
const registerValidation = [
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
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format email tidak valid'),
  
  body('password')
    .notEmpty()
    .withMessage('Password harus diisi')
];

// Validation rules for preferences
const preferencesValidation = [
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
const movieIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID film harus berupa angka positif')
];

// Validation rules for query parameters
const searchValidation = [
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

module.exports = {
  registerValidation,
  loginValidation,
  preferencesValidation,
  movieIdValidation,
  searchValidation
};