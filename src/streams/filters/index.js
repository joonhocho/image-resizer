'use strict';

var path = require('path');
var pathParts = __dirname.split('/');
var pluginDir = [process.cwd(), 'plugins', pathParts[pathParts.length - 1]].join('/');
var modules = {};

// get all the files from this directory
require('glob').sync(__dirname + '/*.js').forEach(function (file) {
  var mod = path.basename(file, '.js');
  if (mod !== 'index') {
    console.log(Date.now(), 'filters', mod, file);
    modules[mod] = require(file);
  }
});

// get all the files from the current working directory and override the local
// ones with any custom plugins
if (require('fs').existsSync(pluginDir)) {
  require('glob').sync(pluginDir + '/*.js').forEach(function (file) {
    var mod = path.basename(file, '.js');
    if (mod !== 'index') {
      console.log(Date.now(), 'filters plugins', mod, file);
      modules[mod] = require(file);
    }
  });
}

module.exports = modules;
