const controller = require('../controllers/recurring-schedule.controller');

module.exports = router => {
  router.post('/v1/recurring-schedule', Middleware.canAccessFeature('tutor'), controller.create, Middleware.Response.success('create'));

  router.delete(
    '/v1/recurring-schedule/:id',
    Middleware.canAccessFeature('tutor'),
    controller.findOne,
    controller.remove,
    Middleware.Response.success('remove')
  );

  router.get(
    '/v1/recurring-schedule',
    Middleware.canAccessFeature('tutor'),
    controller.getListRecurring,
    Middleware.Response.success('listRecurring')
  );
};
