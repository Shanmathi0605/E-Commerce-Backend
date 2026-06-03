// Errors
const CustomError = require('./errors/custom-error');
const BadRequestError = require('./errors/bad-request-error');
const DatabaseConnectionError = require('./errors/database-connection-error');
const NotAuthorizedError = require('./errors/not-authorized-error');
const NotFoundError = require('./errors/not-found-error');
const RequestValidationError = require('./errors/request-validation-error');

// Middlewares
const currentUser = require('./middlewares/current-user');
const errorHandler = require('./middlewares/error-handler');
const validateRequest = require('./middlewares/validate-request');
const { requireAuth, requireRole } = require('./middlewares/require-auth');

// Events
const Topics = require('./events/topics');
const BasePublisher = require('./events/base-publisher');
const BaseConsumer = require('./events/base-consumer');

module.exports = {
  // Errors
  CustomError,
  BadRequestError,
  DatabaseConnectionError,
  NotAuthorizedError,
  NotFoundError,
  RequestValidationError,

  // Middlewares
  currentUser,
  errorHandler,
  validateRequest,
  requireAuth,
  requireRole,

  // Events
  Topics,
  BasePublisher,
  BaseConsumer
};
