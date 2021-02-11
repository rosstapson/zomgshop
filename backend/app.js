const express = require('express')
const errorMiddleware = require('./middleware/errors')

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')

const dotenv = require('dotenv')
dotenv.config({path: 'backend/config/config.env'})


const app = express();
app.use(bodyParser.urlencoded({ extended: true}))
app.use(express.json())
app.use(cookieParser())


// import rouets
const product = require('./routes/product')
const auth = require('./routes/auth')
const order = require('./routes/order')
const payment = require('./routes/payment')

app.use('/api/v1', product)
app.use('/api/v1', auth)
app.use('/api/v1', order)
app.use('/api/v1', payment)

app.use(errorMiddleware)

module.exports = app