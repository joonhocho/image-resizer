'use strict';

var Writable = require('stream').Writable;
var env = require('../config/environment_vars');
//var maxAge = 60 * 60 * 24 * 30; // 1 month

function ResponseWriter(request, response) {
  if (!(this instanceof ResponseWriter)) {
    return new ResponseWriter(request, response);
  }

  this.request = request;
  this.response = response;

  Writable.call(this, {
    objectMode: true
  });
}

require('util').inherits(ResponseWriter, Writable);

ResponseWriter.prototype.expiresIn = function (maxAge) {
  return new Date(Date.now() + maxAge * 1000).toGMTString();
};

ResponseWriter.prototype.shouldCacheResponse = function () {
  return !env.development || env.CACHE_DEV_REQUESTS;
};

ResponseWriter.prototype._write = function (image) {
  if (image.isError()) {
    image.log.error(image.error.message);
    image.log.flush();
    this.response.status(image.error.statusCode || 500).end();
    return;
  }

  if (image.modifiers.action === 'json') {
    if (this.shouldCacheResponse()) {
      this.response.set({
        'Cache-Control': 'public',
        'Expires': this.expiresIn(env.JSON_EXPIRY),
        'Last-Modified': new Date(0).toGMTString(),
        'Vary': 'Accept-Encoding'
      });
    }

    this.response.status(200).json(image.contents);
    image.log.flush();

    return this.end();
  }

  if (this.shouldCacheResponse()) {
    this.response.set({
      'Cache-Control': 'public',
      'Expires': this.expiresIn(image.expiry),
      'Last-Modified': new Date(0).toGMTString(),
      'Vary': 'Accept-Encoding'
    });
  }

  this.response.type(image.format);

  if (image.isStream()) {
    image.contents.pipe(this.response);
  }
  else {
    image.log.log('original image size:' + (image.originalContentLength / 1000).toString() + 'kb');
    image.log.log('size saving:' + image.sizeSaving() + '%');

    this.response.status(200).send(image.contents);
  }

  // flush the log messages and close the connection
  image.log.flush();
  this.end();
};

module.exports = ResponseWriter;
