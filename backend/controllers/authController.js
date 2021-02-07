const User = require('../models/user')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const sendToken = require('../utils/jwtToken')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const formidable = require('formidable');
const { isNullOrUndefined } = require('util')


// register user => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {


    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log(err);
            res.status(500).send(err)
            return;
        }
        //console.log(fields)
        const result = await cloudinary.v2.uploader.upload(fields.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })
        const { name, email, password } = fields
        const user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: result.public_id,
                url: result.secure_url
            }

        })

        sendToken(user, 200, res)
    })


})

// login user => /api/v1/login

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    console.log("login")
    const { email, password } = req.body

    // check if email and password are entered
    if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400))
    }

    // find user
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }

    // check password
    const isPasswordMatched = await user.comparePassword(password)

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }

    sendToken(user, 200, res)
})

// forget password email => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log(err);
            res.status(500).send(err)
            return;
        }

        const { email } = fields
        const user = await User.findOne({ email: email })
        if (!user) {
            return next(new ErrorHandler('Invalid email', 404))
        }

        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false })

        // create reset password url
        const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`

        const message = 'Your password reset token is as follows: \n\n' + resetUrl

        try {
            await sendEmail({
                email: user.email,
                subject: 'Shopit password reset',
                message
            })

            res.status(200).json({
                success: true,
                message: "email sent to " + user.email
            })


        } catch (error) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined
            await user.save({ validateBeforeSave: false })
            return next(new ErrorHandler(error.message, 500))
        }

    })
    console.log("forgot passwrod");





    /* 
    var transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "7a2ec983ff1338",
    pass: "2b7088d853cf69"
  }
});
    */
})

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log(err);
            res.status(500).send(err)
            return;
        }

        const { password, confirmPassword } = fields
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        })

        if (!user) {
            return next(new ErrorHandler('Token expired or invalid', 400))
        }

        if (password !== confirmPassword) {
            return next(new ErrorHandler('Password does not match confirm password', 400))
        }

        user.password = password
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save()

        //sendToken(user, 200, res);
        res.status(201).json({ success: "zomg"})
    })

})

// get current user details => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        user
    })
})

// update password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {

    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log(err);
            res.status(500).send(err)
            return;
        }

        const { oldPassword, newPassword } = fields

        const user = await User.findById(req.user.id).select('+password')
        const isMatched = await user.comparePassword(oldPassword)
        if (!isMatched) {
            return next(new ErrorHandler('Old password invalid', 400))
        }

        user.password = newPassword

        await user.save()

        res.status(201).json({ success: true })
    })

})

// update profile => /api/v1/me/update
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log(err);
            res.status(500).send(err)
            return;
        }

        const { name, email } = fields
        const newUserData = {
            name,
            email
        }

        // update avatar
        if (fields.avatar && fields.avatar !== '' && fields.avatar !== 'undefined') {
            const user = await User.findById(req.user.id)
            const image_id = user.avatar.public_id
            const res = await cloudinary.v2.uploader.destroy(image_id)
            const result = await cloudinary.v2.uploader.upload(fields.avatar, {
                folder: 'avatars',
                width: 150,
                crop: "scale"
            })

            newUserData.avatar = {
                public_id: result.public_id,
                url: result.secure_url
            }
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            newUserData,
            { new: true, runValidators: true, useFindAndModify: false }

        )

        res.status(201).json({ success: true })
    })


    // update avatar: TODO


})

// logout user => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now())
    })

    res.status(200).json({
        success: true,
        message: 'Logged out'
    })
})

// Admin routes


// get all users => /api/v1/admin/users
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
})

// get user details => /api/v1/admin/user/:id

exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id)
    if (!user) {
        return next(new ErrorHandler('User not found', 400))
    }
    res.status(200).json({
        success: true,
        user
    })
})

// update user profile => /api/v1/admin/user/:id
exports.updateUserProfile = catchAsyncErrors(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    // avatar: TODO

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(201).json({
        success: true
    })
})

// delete user => /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id)
    if (!user) {
        return next(new ErrorHandler('User not found', 400))
    }

    // remove avatar: TODO

    await user.remove()


    res.status(201).json({
        success: true
    })
})
