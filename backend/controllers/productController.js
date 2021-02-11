const formidable = require('formidable');
const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const APIFeatures = require('../utils/apiFeatures')

// create new: /api/v1/product/new

exports.newProduct = catchAsyncErrors(async (req, res, next) => {

    req.body.user = req.user.id;

    const product = await Product.create(req.body)

    res.status(201).json({
        success: true,
        product
    })
})

// get all products => /api/v1/products?keyword=zomg
exports.getProducts = catchAsyncErrors(async (req, res, next) => {

    const resultsPerPage = 4;
    const productCount = await Product.countDocuments();

    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()

    let products = await apiFeatures.query
    let filteredProductsCount = products.length

    apiFeatures.pagination(resultsPerPage)
    products = await apiFeatures.query

    res.status(200).json({
        success: true,
        count: products.length,
        productCount,
        filteredProductsCount,
        resultsPerPage,
        products
    })



})

// get product details => /api/v1/product/:id
exports.getSingleProduct = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.params.id);
    //console.log("getsingleproduct")
    if (!product) {
        return next(new ErrorHandler('Product not found', 404))
    }

    res.status(200).json({
        success: true,
        product
    })


})

// update product

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {


    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler('Product not found', 404))
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(201).json({
        success: true,
        product
    })
})

// delete product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler('Product not found', 404))
    }

    await product.remove();
    res.status(201).json({
        success: true,
        message: 'Product deleted'
    })
})

// create review  => /api/v1/review

exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log(err);
            res.status(500).send(err)
            return;
        }
        const { rating, comment, productId } = fields
        
        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment: comment
        }

        const product = await Product.findById(productId)

        if (!product) {
            return res.status(500).json({ error: "zomg" })
        }

        const isReviewed = product.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        )

        if (isReviewed) {
            console.log("createProductReview");
            product.reviews.forEach(r => {
                if (r.user.toString() === req.user._id.toString()) {
                    r.comment = comment
                    r.rating = rating
                }
            })
        }
        else {
            product.reviews.push(review)
            product.numOfReviews = product.reviews.length
        }

        product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

        await product.save({
            validateBeforeSave: false
        })

        res.status(200).json({
            success: true
        })
    })

})

// get all product review => /api/v1/reviews
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id)

    if (!product) {
        return next(new ErrorHandler('Product not found', 404))
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

// delete product review => /api/v1/review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id)

    if (!product) {
        return next(new ErrorHandler('Product not found', 404))
    }

    const reviews = product.reviews.filter(r => {
        if (r._id.toString() !== req.query.reviewId.toString()) {
            return r
        }
    })


    const ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    const numOfReviews = reviews.length

    await Product.findByIdAndUpdate({
        reviews, ratings, numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(201).json({
        success: true
    })
})