const express = require('express')
const router = express.Router()

const { newOrder, getSingleOrder, myOrders, allOrders, updateOrder, deleteOrder } = require('../controllers/orderController')

const { isAuthenticatedUser, authoriseRoles } = require('../middleware/auth')

router.route('/order/new').post(isAuthenticatedUser, newOrder);
router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder)
router.route('/orders/me').get(isAuthenticatedUser, myOrders)
router.route('/admin/orders').get(isAuthenticatedUser, authoriseRoles('admin'), allOrders)
router.route('/admin/order/:id')
    .put(isAuthenticatedUser, authoriseRoles('admin'), updateOrder)
    .delete(isAuthenticatedUser, authoriseRoles('admin'), deleteOrder)


module.exports = router