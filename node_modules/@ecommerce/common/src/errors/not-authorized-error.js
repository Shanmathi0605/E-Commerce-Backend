const CustomError = require('./custom-error');

class NotAuthorizedError extends CustomError {
  constructor() {
    super('Not authorized');
  }

  get statusCode() {
    return 401;
  }

  serializeErrors() {
    return [{ message: 'Not authorized' }];
  }
}

module.exports = NotAuthorizedError;
