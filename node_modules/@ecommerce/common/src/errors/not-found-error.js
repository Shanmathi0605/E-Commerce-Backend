const CustomError = require('./custom-error');

class NotFoundError extends CustomError {
  constructor() {
    super('Route not found');
  }

  get statusCode() {
    return 404;
  }

  serializeErrors() {
    return [{ message: 'Not found' }];
  }
}

module.exports = NotFoundError;
