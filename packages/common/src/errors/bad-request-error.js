const CustomError = require('./custom-error');

class BadRequestError extends CustomError {
  constructor(message) {
    super(message);
    this.reason = message;
  }

  get statusCode() {
    return 400;
  }

  serializeErrors() {
    return [{ message: this.reason }];
  }
}

module.exports = BadRequestError;
