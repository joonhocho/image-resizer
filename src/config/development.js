'use strict';

module.exports = function (app) {

  var env = require('./environment_vars');

  app.set('views', env.LOCAL_FILE_PATH + '/test');
  app.engine('html', require('ejs').renderFile);
  app.set('port', env.PORT || 3001);
  app.use(require('morgan')('dev'));
  app.use(require('errorhandler')());

};
