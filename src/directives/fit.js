'use strict';

var Sharp = require('sharp');
var map = require('map-stream');
var string = require('../utils/string');

exports.parse = function (w, h) {
  if (arguments.length !== 2) {
    throw new Error('Invalid fit arguments');
  }

  w = string.toUIntOrThrow(w);
  string.assertRange(w, 0, 2048);

  h = string.toUIntOrThrow(h);
  string.assertRange(h, 0, 2048);

  return {
    width: w,
    height: h
  };
};

exports.stream = function (options) {
  return map(function (image, callback) {
    if (image.isError()) {
      return callback(null, image);
    }

    image.log.time('fit');

    new Sharp(image.contents)
      .sequentialRead()
      .withoutEnlargement()
      .rotate()
      .resize(options.width, options.height)
      .max()
      .toBuffer(function (err, buffer) {
        image.log.timeEnd('fit');

        if (err) {
          image.log.error('fit error', err);
          image.error = err;
        }
        else {
          image.contents = buffer;
        }

        callback(null, image);
      });
  });
};
