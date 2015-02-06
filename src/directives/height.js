'use strict';

var Sharp = require('sharp');
var map = require('map-stream');
var string = require('../utils/string');

exports.parse = function (h) {
  if (arguments.length !== 1) {
    throw new Error('Invalid height arguments');
  }

  h = string.toUIntOrThrow(h);
  string.assertRange(h, 0, 2048);

  return h;
};

exports.stream = function (height) {
  return map(function (image, callback) {
    if (image.isError()) {
      return callback(null, image);
    }

    image.log.time('height');

    // .sequentialRead() causes out of order read errors
    new Sharp(image.contents)
      .withoutEnlargement()
      .rotate()
      .resize(null, height)
      .toBuffer(function (err, buffer) {
        image.log.timeEnd('height');

        if (err) {
          image.log.error('height error', err);
          image.error = err;
        }
        else {
          image.contents = buffer;
        }

        callback(null, image);
      });
  });
};
