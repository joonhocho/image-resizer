'use strict';

var Sharp = require('sharp');
var map = require('map-stream');
var dims = require('../lib/dimensions');
var string = require('../utils/string');

exports.parse = function (w, h, x, y) {
  w = string.toUIntOrThrow(w);
  string.assertRange(w, 0, 2048);

  h = string.toUIntOrThrow(h);
  string.assertRange(h, 0, 2048);

  x = string.toUFloatOrThrow(x);
  string.assertRange(x, 0, 1);

  y = string.toUFloatOrThrow(y);
  string.assertRange(y, 0, 1);

  return {
    x: x,
    y: y,
    width: w,
    height: h
  };
};

exports.stream = function (options) {
  return map(function (image, callback) {
    if (image.isError()) {
      return callback(null, image);
    }

    image.log.time('fill');

    var sharp = new Sharp(image.contents).metadata(function (err, size) {
      if (err) {
        image.error = err;
        callback(null, image);
        return;
      }

      var dim = dims.scaleToFill(size.width, size.height, options.width, options.height);

      sharp
        .resize(dim.width, dim.height)
        .extract(dim.y, dim.x, options.width, options.height)
        .toBuffer(function (err, buffer) {
          if (err) {
            image.log.error('resize error', err);
            image.error = new Error(err);
          }
          else {
            image.contents = buffer;
          }

          image.log.timeEnd('resize');
          callback(null, image);
        });
    });
  });
};
