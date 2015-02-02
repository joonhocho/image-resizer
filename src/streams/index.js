'use strict';

var path, modules, streams;

path    = require('path');
modules = require('glob').sync(__dirname + '/*.js');
streams = {};


for (var i=0; i < modules.length; i++){
  var stream = path.basename(modules[i], '.js');
  if ( stream !== 'index' ){
    console.log(Date.now(), 'streams', stream, modules[i]);
    streams[stream] = require(modules[i]);
  }
}

module.exports = streams;
