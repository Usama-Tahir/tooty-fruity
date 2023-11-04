const zoomusController = require('../controllers/zoomus.controller');
const { tokenCheck } = require('../middlewares/tokenCheck');

module.exports = router => {
  /**
   * @apiGroup Zoomus
   * @apiVersion 1.0.0
   * @apiName Webhook
   * @api {post} /v1/zoomus/hook Webhook
   * @apiPermission all
   */
  router.post('/v1/zoomus/hook', Middleware.Request.log, zoomusController.hook, Middleware.Response.success('hook'));

  router.get('/v1/zoomus/get-user/:email', tokenCheck, Middleware.Request.log, zoomusController.getUser, Middleware.Response.success('getUser'));

  router.post(
    '/v1/zoomus/create-user/:email',
    tokenCheck,
    Middleware.hasRole('admin'),
    zoomusController.inviteUser,
    Middleware.Response.success('invite')
  );
};
