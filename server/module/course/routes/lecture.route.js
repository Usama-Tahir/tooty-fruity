const controller = require('../controllers/lecture.controller');

module.exports = router => {
  /**
   * @apiDefine lectureRequest
   * @apiParam {String}   title        Lecture name
   * @apiParam {String}   sectionId     Section Id
   * @apiParam {String}   description  Lecture description
   * @apiParam {Number}   ordering     Lecture ordering
   * @apiParam {Number}   totalLength     Lecture ordering
   * @apiParam {String}   mediaType  Media type
   * @apiParam {Boolean}   preview Preview or private
   * @apiParam {String} mediaId Media Id
   */

  /**
   * @apiDefine lectureResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "title": "Lecture name",
   *        "description": "",
   *        "sectionId": "5b99da5989b54c53851fa66",
   *        "section": {}
   *        "ordering": 0,
   *        "totalLength": 0,
   *        "mediaType": "video",
   *        "preview": true,
   *        "mediaId": "5b99da5989b54c53851fa66",
   *        "media": {},
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *    },
   *    "error": false
   * }
   */
  router.get('/v1/lectures', Middleware.loadUser, controller.list, Middleware.Response.success('list'));
  router.get('/v1/lectures/:id', Middleware.loadUser, controller.findOne, Middleware.Response.success('lecture'));
  /**
   * @apiGroup Lecture
   * @apiVersion 1.0.0
   * @api {post} /v1/lectures  Create new lecture
   * @apiDescription Create new lecture
   * @apiUse authRequest
   * @apiUse lectureRequest
   * @apiPermission tutor
   */
  router.post('/v1/lectures', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  /**
   * @apiGroup Subject
   * @apiVersion 1.0.0
   * @api {put} /v1/lectures/:tutorId  Update a lecture
   * @apiDescription Update a lecture
   * @apiUse authRequest
   * @apiParam {String}   id        lecture id
   * @apiUse lectureRequest
   * @apiUse userProfileResponse
   * @apiPermission tutor
   */
  router.put(
    '/v1/lectures/:id',
    Middleware.isAuthenticated,
    controller.findOne,
    controller.update,
    Middleware.Response.success('update')
  );

  router.delete(
    '/v1/lectures/:id',
    Middleware.isAuthenticated,
    controller.findOne,
    controller.remove,
    Middleware.Response.success('remove')
  );
};
