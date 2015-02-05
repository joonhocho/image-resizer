'use strict';

var env = require('./src/config/environment_vars');

module.exports = {

  Image: require('./src/image'),
  Director: require('./src/director'),

  streams: require('./src/streams'),
  sources: require('./src/streams/sources'),
  filter: require('./src/streams/filter'),
  modifiers: require('./src/lib/modifiers').map,

  env: env,
  expressConfig: require('./src/config/' + env.NODE_ENV)

};
