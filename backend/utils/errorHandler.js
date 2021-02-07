// error handler class

class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message)
        // console.log(statusCode)
        // console.log(message)
        this.statusCode = statusCode

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = ErrorHandler