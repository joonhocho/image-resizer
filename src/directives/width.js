'use strict';

var Sharp = require('sharp');
var map = require('map-stream');
var string = require('../utils/string');

exports.parse = function (w) {
  if (arguments.length !== 1) {
    throw new Error('Invalid width arguments');
  }

  w = string.toUIntOrThrow(w);
  string.assertRange(w, 1, 2048);

  return w;
};

exports.stream = function (width) {
  return map(function (image, callback) {
    if (image.isError()) {
      return callback(null, image);
    }

    image.log.time('width');

    // .sequentialRead() causes out of order read errors
    new Sharp(image.contents)
      .withoutEnlargement()
      .rotate()
      .resize(width, null)
      .toBuffer(function (err, buffer) {
        image.log.timeEnd('width');

        if (err) {
          image.log.error('width error', err);
          image.error = err;
        }
        else {
          image.contents = buffer;
        }

        callback(null, image);
      });
  });
};
