const controller = require('../controllers/my-course.controller');

module.exports = router => {
  /**
   * @apiDefine myCourseRequest
   */

  /**
   * @apiDefine myCourseRequest
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "courseId": "5b99da5989b54c53851fa",
   *        "transactionId": "5b99da5989b54c53851fa",
   *        "transaction": {},
   *        "paid": true
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *    },
   *    "error": false
   * }
   */
  router.get('/v1/my-courses', Middleware.isAuthenticated, controller.list, Middleware.Response.success('list'));
  router.get('/v1/my-courses/:id', Middleware.isAuthenticated, controller.findOne, Middleware.Response.success('course'));
  router.get(
    '/v1/my-course/get-by-course-id/:courseId',
    Middleware.isAuthenticated,
    controller.findOneByCourseId,
    Middleware.Response.success('byCourseId')
  );
  router.get('/v1/my-courses/:id/sections', Middleware.isAuthenticated, controller.listSection, Middleware.Response.success('sections'));
  router.delete('/v1/my-courses/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));
  router.put(
    '/v1/my-courses/:id/update-progress',
    Middleware.isAuthenticated,
    controller.findOne,
    controller.updateProgress,
    Middleware.Response.success('updateProgress')
  );

  router.put(
    '/v1/my-courses/:id/complete',
    Middleware.isAuthenticated,
    controller.findOne,
    controller.complete,
    Middleware.Response.success('complete')
  );
};
