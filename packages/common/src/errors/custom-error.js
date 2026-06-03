class CustomError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  // Subclasses must define these
  get statusCode() {
    throw new Error('statusCode must be implemented');
  }

  serializeErrors() {
    throw new Error('serializeErrors must be implemented');
  }
}

module.exports = CustomError;
