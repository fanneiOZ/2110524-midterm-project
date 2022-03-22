class HttpException extends Error {
  constructor(statusCode, errorCode, message) {
    super(message)
    this.statusCode = statusCode
    this.errorCode = errorCode
  }

  get errorResponseBody() {
    return Object.freeze({ code: this.errorCode, message: this.message })
  }
}

module.exports = { HttpException }
