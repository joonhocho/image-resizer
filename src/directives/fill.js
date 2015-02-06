'use strict';

var Sharp = require('sharp');
var map = require('map-stream');
var dims = require('../lib/dimensions');
var string = require('../utils/string');

exports.parse = function (w, h, x, y) {
  if (arguments.length === 2) {
    x = y = 0.5;
  }
  else if (arguments.length === 4) {
    x = string.toUFloatOrThrow(x);
    string.assertRange(x, 0, 1);

    y = string.toUFloatOrThrow(y);
    string.assertRange(y, 0, 1);
  }
  else {
    throw new Error('Invalid fill arguments');
  }

  w = string.toUIntOrThrow(w);
  string.assertRange(w, 1, 2048);

  h = string.toUIntOrThrow(h);
  string.assertRange(h, 1, 2048);

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

    image.log.time('metadata');

    var sharp = new Sharp(image.contents).metadata(function (err, size) {
      image.log.timeEnd('metadata');

      if (err) {
        image.error = err;
        callback(null, image);
        return;
      }

      image.log.time('fill');

      size = dims.orientedSize(size);

      var dim = dims.scaleToFill(size.width, size.height, options.width, options.height);

      // .sequentialRead() causes out of order read errors
      sharp
        .withoutEnlargement()
        .rotate()
        .resize(dim.width, dim.height)
        .extract(options.y * dim.maxCropY, options.x * dim.maxCropX, dim.cropWidth, dim.cropHeight)
        .toBuffer(function (err, buffer) {
          image.log.timeEnd('fill');

          if (err) {
            image.log.error('fill error', err);
            image.error = err;
          }
          else {
            image.contents = buffer;
          }

          callback(null, image);
        });
    });
  });
};
