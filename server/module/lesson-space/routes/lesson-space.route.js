const controller = require('../controllers/lesson-space.controller');

module.exports = router => {
  /**
   * @apiGroup Lesson Space
   * @apiVersion 1.0.0
   * @apiName Webhook
   * @api {post} /v1/lesson-space/hook Webhook
   * @apiPermission all
   */
  router.post('/v1/lesson-space/hook', Middleware.Request.log, Middleware.appointmentLog, controller.hook, Middleware.Response.success('hook'));
};
