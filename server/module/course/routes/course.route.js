const controller = require('../controllers/course.controller');

module.exports = router => {
  /**
   * @apiDefine courseRequest
   * @apiParam {String}   name        Course name
   * @apiParam {String[]} categoryIds  Course Categories
   * @apiParam {Number}   price        Course price
   * @apiParam {String}   description  Course description
   * @apiParam {String}   mainImageId  Course main image
   * @apiParam {String}   introductionVideoId  Course video introduction
   * @apiParam {String[]} goalCourse  All the end of my course,students will be able to
   * @apiParam {String[]} whyJoinCourse  Why should take this course? Who should not?
   * @apiParam {String[]} needToJoinCourse  What will students need to know or do before starting this course?
   */

  /**
   * @apiDefine courseResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "name": "Course name",
   *        "alias": course-alias,
   *        "description": "",
   *        "course": {},
   *        "categories": [],
   *        "mainImage": {},
   *        "videoIntroduction": {},
   *        "mainImageId": "5b99da5989b54c53851fa66c",
   *        "introductionVideoId": "5b99da5989b54c53851fa66c",
   *        "price": "0000",
   *        "goalCourse": [],
   *        "whyJoinCourse": [],
   *        "needToJoinCourse": [],
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *    },
   *    "error": false
   * }
   */
  router.get('/v1/courses', Middleware.loadUser, controller.list, Middleware.Response.success('list'));
  router.get('/v1/courses/:id', Middleware.loadUser, controller.findOne, Middleware.Response.success('course'));
  /**
   * @apiGroup Course
   * @apiVersion 1.0.0
   * @api {post} /v1/courses  Create new course
   * @apiDescription Create new course
   * @apiUse authRequest
   * @apiUse courseRequest
   * @apiPermission course
   */
  router.post('/v1/courses', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Course
   * @apiVersion 1.0.0
   * @api {put} /v1/courses/:courseId  Update a course
   * @apiDescription Update a course
   * @apiUse authRequest
   * @apiParam {String}   id        course id
   * @apiUse courseRequest
   * @apiUse userProfileResponse
   * @apiPermission course
   */
  router.put('/v1/courses/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));

  router.delete('/v1/courses/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));

  /**
   * @apiGroup Course
   * @apiVersion 1.0.0
   * @api {post} /v1/courses/:courseId/reject Reject
   * @apiParam {String}   courseId
   * @apiParam {String}   [reason] Reason
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/courses/:courseId/reject', Middleware.hasRole('admin'), controller.reject, Middleware.Response.success('reject'));

  /**
   * @apiGroup Course
   * @apiVersion 1.0.0
   * @api {post} /v1/courses/:courseId/approve Approve
   * @apiParam {String}   courseId
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/courses/:courseId/approve', Middleware.hasRole('admin'), controller.approve, Middleware.Response.success('approve'));

  router.get('/v1/courses/:tutorId/transaction', Middleware.isAuthenticated, controller.transaction, Middleware.Response.success('transaction'));
  router.get(
    '/v1/courses/:tutorId/transaction/:id',
    Middleware.loadUser,
    controller.transactionDetail,
    Middleware.Response.success('transactionDetail')
  );

  // get user enrolled in courses
  router.get('/v1/courses/:courseId/enrolled', Middleware.loadUser, controller.enrolledUsers, Middleware.Response.success('enrolled'));

  /**
   * @apiGroup Course
   * @apiVersion 1.0.0
   * @api {post} /v1/courses/:courseId/disable Disable course
   * @apiParam {String}   courseId
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/courses/:courseId/disable', Middleware.hasRole('admin'), controller.disable, Middleware.Response.success('disable'));

  /**
   * @apiGroup Course
   * @apiVersion 1.0.0
   * @api {post} /v1/courses/:courseId/enable Enable course
   * @apiParam {String}   courseId
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "code": 200,
   *       "message": "OK",
   *      "data": {
   *           "success": true
   *       },
   *       "error": false
   *  }
   * @apiPermission all
   */
  router.post('/v1/courses/:courseId/enable', Middleware.hasRole('admin'), controller.enable, Middleware.Response.success('enable'));
};
