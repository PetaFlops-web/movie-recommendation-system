/**
 * Send a standardized success response
 * @param {object} res - Express response object
 * @param {object} data - Response payload
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a standardized error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {object} details - Additional error details (only in development)
 */
export const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message,
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};
