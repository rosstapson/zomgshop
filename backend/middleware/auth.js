const User = require('../models/user')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('./catchAsyncErrors')
const jwt = require('jsonwebtoken')

// checks if user is authenticated
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    
    const { token } = req.cookies

    if(!token) {
        console.log('zomg, no token')
        return next(new ErrorHandler('Login to access this resource', 401))
    }
    

    const decoded = jwt.verify(
         token, 
         process.env.JWT_SECRET
    )
    
    req.user = await User.findById(decoded.id)

    next()

})

// hand user roles
exports.authoriseRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            console.log('user unauthorised')
            return next( new ErrorHandler('Role ' + req.user.role + ' is not permitted to access this resource', 403))
        }
        next()
    }
}