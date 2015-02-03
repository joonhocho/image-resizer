'use strict';

var gm = require('gm');
var map = require('map-stream');

module.exports = function () {
  return map(function (image, callback) {
    if (image.isError()) {
      return callback(null, image);
    }

    if (image.modifiers.action !== 'json') {
      image.log.log('identify:', 'no identify');
      return callback(null, image);
    }

    image.log.time('identify');
    gm(image.contents, image.format).identify(function (err, data) {
      image.log.timeEnd('identify');

      if (err) {
        image.log.error('identify error', err);
        image.error = new Error(err);
      }
      else {
        image.contents = data;
      }

      callback(null, image);
    });
  });
};
