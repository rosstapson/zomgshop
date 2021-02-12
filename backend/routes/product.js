const express = require('express')
const router = express.Router()


const { getProducts, newProduct, getSingleProduct, updateProduct, deleteProduct, createProductReview, getProductReviews, deleteReview, getAdminProducts } = require('../controllers/productController')

const { isAuthenticatedUser, authoriseRoles } = require('../middleware/auth')


router.route('/products').get(getProducts)
router.route('/admin/products').get(isAuthenticatedUser, authoriseRoles('admin'), getAdminProducts)
router.route('/admin/product/new').post(isAuthenticatedUser, authoriseRoles('admin'), newProduct)
router.route('/product/:id').get(getSingleProduct)
router.route('/admin/product/:id').put(isAuthenticatedUser, authoriseRoles('admin'), updateProduct)
router.route('/admin/product/:id').delete(isAuthenticatedUser, authoriseRoles('admin'), deleteProduct)
router.route('/review')
    .put(isAuthenticatedUser, createProductReview)
    .delete(isAuthenticatedUser, deleteReview)
router.route('/reviews').get(isAuthenticatedUser, getProductReviews)

module.exports = router;