const CustomError = require('./custom-error');

class DatabaseConnectionError extends CustomError {
  constructor() {
    super('Error connecting to database');
  }

  get statusCode() {
    return 500;
  }

  serializeErrors() {
    return [{ message: 'Error connecting to database' }];
  }
}

module.exports = DatabaseConnectionError;
