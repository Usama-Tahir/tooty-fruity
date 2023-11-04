const controller = require('../controllers/lecture-media.controller');

module.exports = router => {
  router.get('/v1/lecture-medias', Middleware.loadUser, controller.list, Middleware.Response.success('list'));

  router.post('/v1/lecture-medias', Middleware.isAuthenticated, controller.create, Middleware.Response.success('create'));

  router.put('/v1/lecture-medias/:id', Middleware.isAuthenticated, controller.findOne, controller.update, Middleware.Response.success('update'));

  router.delete('/v1/lecture-medias/:id', Middleware.isAuthenticated, controller.findOne, controller.remove, Middleware.Response.success('remove'));
};
