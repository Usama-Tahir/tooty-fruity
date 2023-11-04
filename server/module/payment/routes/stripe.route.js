const stripeController = require('../controllers/stripe.controller');

module.exports = router => {
  router.post('/v1/payment/stripe/hook', Middleware.Request.log, stripeController.hook, Middleware.Response.success('hook'));
};
