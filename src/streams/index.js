'use strict';

var path = require('path');
var camelCase = require('../utils/string').camelCase;

module.exports = require('glob').sync(__dirname + '/*.js').reduce(function (streams, module) {
  var stream = path.basename(module, '.js');
  if (stream !== 'index') {
    console.log(Date.now(), 'streams', camelCase(stream), module);
    streams[camelCase(stream)] = require(module);
  }
  return streams;
}, {});
