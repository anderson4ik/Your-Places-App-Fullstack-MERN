class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // Add a "message" property, that we inherite from class Error
    this.code = errorCode; // Add a "code" property, our own property
  }
}

module.exports = HttpError;
