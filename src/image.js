'use strict';

var Logger = require('./utils/logger');
var env = require('./config/environment_vars');
var modifiers = require('./lib/modifiers');
var stream = require('stream');
var Stream = stream.Stream;
var Readable = stream.Readable;
var sources = require('./streams/sources');

function toKeys(arr) {
  return arr.reduce(function (obj, key) {
    obj[key] = 1;
    return obj;
  }, {});
}

var DISALLOWED_SOURCES = toKeys((env.EXCLUDE_SOURCES || '').split(/[\s,]+/));
var ALLOWED_EXTENSIONS = toKeys((env.SUPPORTED_EXTENSIONS || 'jpg,jpeg,gif,png').split(/[\s,]+/));

// Simple stream to represent an error at an early stage, for instance a
// request to an excluded source.
function ErrorStream(image) {
  Readable.call(this, {
    objectMode: true
  });
  this.image = image;
}
require('util').inherits(ErrorStream, Readable);

ErrorStream.prototype._read = function () {
  this.push(this.image);
  this.push(null);
};

function Image(url) {
  console.log(Date.now(), 'new Image', url);
  this.error = null;
  this.mark = Date.now();

  this.url = url;
  this.urlParts = url.replace(/^\//, '').split('/');

  console.log(Date.now(), 'before parseImage');
  // determine the name and format (mime) of the requested image
  this.parseImage();
  console.log(Date.now(), 'done parseImage');

  this.validateFormat();

  console.log(Date.now(), 'before modifiers.parse', url);
  // determine the requested modifications
  this.modifiers = modifiers.parse(this.urlParts[0]);

  console.log(Date.now(), 'done modifiers.parse', this.modifiers);
  console.log(Date.now(), 'before parseUrl');
  // pull the various parts needed from the request params
  this.parseUrl();
  console.log(Date.now(), 'done parseUrl');

  // placeholder for the buffer/stream coming from s3, will hold the image
  this.contents = null;

  // placeholder for the size of the original image
  this.originalContentLength = 0;

  // set the default expiry length, can be altered by a source file
  this.expiry = env.IMAGE_EXPIRY;

  // all logging strings will be queued here to be written on response
  this.log = new Logger();
  console.log(Date.now(), 'done new Image');
}

Image.formatErrorText = 'not valid image format';

Image.prototype.validateFormat = function () {
  console.log(Date.now(), 'format', this.format);
  // reject this request if the image format is not correct
  if (ALLOWED_EXTENSIONS[this.format] !== 1) {
    throw new Error(Image.formatErrorText);
  }
};

// Determine the name and format of the requested image
Image.prototype.parseImage = function () {
  var fileStr = this.urlParts[this.urlParts.length - 1];
  this.image = fileStr;

  var parts = fileStr.split('.');
  this.format = parts[parts.length - 1];
};

// Determine the file path for the requested image
Image.prototype.parseUrl = function () {
  // account for any spaces in the path
  this.path = decodeURI(this.urlParts.slice(1).join('/'));
};

Image.prototype.isError = function () {
  return this.error != null;
};

Image.prototype.isStream = function () {
  return !!this.contents && (this.contents instanceof Stream);
};

Image.prototype.isBuffer = function () {
  return !!this.contents && Buffer.isBuffer(this.contents);
};

Image.prototype.getFile = function () {
  console.log(Date.now(), 'image.getFile');
  var streamType = env.DEFAULT_SOURCE;

  // look to see if the request has a specified source
  var external = this.modifiers.external;
  if (external && sources[external]) {
    streamType = external;
  }

  console.log(Date.now(), 'image.getFile steramType', streamType);

  var Stream;
  // if this request is for an excluded source create an ErrorStream
  if (DISALLOWED_SOURCES[streamType] === 1) {
    console.error(Date.now(), 'image.getFile steramType: not supported');
    this.error = new Error(streamType + ' is an excluded source');
    Stream = ErrorStream;
  }
  else {
    // if all is well find the appropriate stream
    this.log.log('new stream created!');
    Stream = sources[streamType];
  }

  console.log(Date.now(), 'image.getFile new Stream', Stream.name);
  return new Stream(this);
};

Image.prototype.sizeReduction = function () {
  return (this.originalContentLength - this.contents.length) / 1000;
};

Image.prototype.sizeSaving = function () {
  var originalContentLength = this.originalContentLength;
  return ((originalContentLength - this.contents.length) / originalContentLength * 100).toFixed(2);
};

module.exports = Image;
