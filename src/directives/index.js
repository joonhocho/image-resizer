'use strict';

var path = require('path');

module.exports = require('glob').sync(__dirname + '/*.js').reduce(function (map, filename) {
  var name = path.basename(filename, '.js');
  if (name !== 'index') {
    console.log(Date.now(), 'directive', filename);
    map[name] = require(filename);
  }
  return map;
}, {});
