const CustomError = require('./custom-error');

class RequestValidationError extends CustomError {
  constructor(errors) {
    super('Invalid request parameters');
    this.errors = errors;
  }

  get statusCode() {
    return 400;
  }

  serializeErrors() {
    return this.errors.map((err) => {
      // express-validator format may vary depending on the version
      return { message: err.msg, field: err.path || err.param };
    });
  }
}

module.exports = RequestValidationError;
