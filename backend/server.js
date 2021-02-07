const app = require('./app')
const connectDatabase = require('./config/database')

const dotenv = require('dotenv')
const cloudinary = require('cloudinary')

// handle uncaught exceptions
process.on('uncaughtException', err => {
    console.log('error: ' + err.message)
    console.log('shutting down server, oh noes.')
    process.exit(1)
    //server.close(() => process.exit(1))
})

//console.log(a)

// set up config
dotenv.config({path: 'backend/config/config.env'})

connectDatabase()

// set up cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const server = app.listen(process.env.PORT, () => {
    console.log('listening on port ' + process.env.PORT + ' in ' + process.env.NODE_ENV)
    //console.log('zomg')
})

// handle unhandled promise rejections
process.on('unhandledRejection', err => {
    console.log('error: ' + err.message)
    console.log('shutting down server, oh noes.')
    server.close(() => process.exit(1))
})

