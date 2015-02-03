'use strict';

module.exports = function (app) {

  app.set('port', process.env.PORT || 3001);
  app.use(require('morgan')('dev'));
  app.use(require('errorhandler')());

};
