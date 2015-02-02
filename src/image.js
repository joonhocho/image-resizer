'use strict';

var _, Logger, env, modifiers, stream, util;

_         = require('lodash');
Logger    = require('./utils/logger');
env       = require('./config/environment_vars');
modifiers = require('./lib/modifiers');
stream    = require('stream');
util      = require('util');


// Simple stream to represent an error at an early stage, for instance a
// request to an excluded source.
function ErrorStream(image){
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
}
util.inherits(ErrorStream, stream.Readable);

ErrorStream.prototype._read = function(){
  this.push(this.image);
  this.push(null);
};


function Image(request){
  console.log(Date.now(), 'new Image', request);
  // placeholder for any error objects
  this.error = null;

  // set a mark for the start of the process
  this.mark = Date.now();

  console.log(Date.now(), 'before parseImage');
  // determine the name and format (mime) of the requested image
  this.parseImage(request);
  console.log(Date.now(), 'done parseImage');

  console.log(Date.now(), 'format', this.format);
  // reject this request if the image format is not correct
  if (_.indexOf(Image.validFormats, this.format) === -1){
    this.error = new Error(Image.formatErrorText);
  }

  console.log(Date.now(), 'before modifiers.parse', request.path);
  // determine the requested modifications
  this.modifiers = modifiers.parse(request.path);

  console.log(Date.now(), 'done modifiers.parse', this.modifiers);
  console.log(Date.now(), 'before parseUrl');
  // pull the various parts needed from the request params
  this.parseUrl(request);
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


Image.validFormats = ['jpeg', 'jpg', 'gif', 'png'];
Image.formatErrorText = 'not valid image format';


// Determine the name and format of the requested image
Image.prototype.parseImage = function(request){
  var fileStr = _.last(request.path.split('/'));

  // clean out any metadata format
  fileStr = fileStr.replace(/.json$/, '');

  this.format = _.last(fileStr.split('.')).toLowerCase();
  this.image  = fileStr;
};


// Determine the file path for the requested image
Image.prototype.parseUrl = function(request){
  var parts = request.path.replace(/^\//,'').split('/');

  // overwrite the image name with the parsed version so metadata requests do
  // not mess things up
  parts[parts.length - 1] = this.image;

  // if the request is for no modification or metadata then assume the s3path
  // is the entire request path
  if (_.indexOf(['original', 'json'], this.modifiers.action) > -1){
    if (this.modifiers.external){
      parts.shift();
      this.path = parts.join('/');
    } else {
      this.path = parts.join('/');
    }
  }

  // otherwise drop the first segment and set the s3path as the rest
  else {
    parts.shift();
    this.path = parts.join('/');
  }

  // account for any spaces in the path
  this.path = decodeURI(this.path);
};


Image.prototype.isError = function(){ return this.error !== null; };


Image.prototype.isStream = function(){
  var Stream = require('stream').Stream;
  return !!this.contents && this.contents instanceof Stream;
};


Image.prototype.isBuffer = function(){
  return !!this.contents &&
    typeof this.contents === 'object' &&
    Object.prototype.toString.call(this.contents.parent) === '[object SlowBuffer]';
};


Image.prototype.getFile = function(){
  console.log(Date.now(), 'image.getFile');
  var sources = require('./streams/sources'),
      excludes = env.EXCLUDE_SOURCES ? env.EXCLUDE_SOURCES.split(',') : [],
      streamType = env.DEFAULT_SOURCE,
      Stream = null;

  // look to see if the request has a specified source
  if (_.has(this.modifiers, 'external')){
    if (_.has(sources, this.modifiers.external)){
      streamType = this.modifiers.external;
    }
  }

  console.log(Date.now(), 'image.getFile steramType', streamType);
  // if this request is for an excluded source create an ErrorStream
  if (excludes.indexOf(streamType) > -1){
    console.error(Date.now(), 'image.getFile steramType: not supported');
    this.error = new Error(streamType + ' is an excluded source');
    Stream = ErrorStream;
  }

  // if all is well find the appropriate stream
  else {
    this.log.log('new stream created!');
    Stream = sources[streamType];
  }

  console.log(Date.now(), 'image.getFile new Stream', Stream.name);
  return new Stream(this);
};


Image.prototype.sizeReduction = function(){
  var size = this.contents.length;
  return (this.originalContentLength - size)/1000;
};


Image.prototype.sizeSaving = function(){
  var oCnt = this.originalContentLength,
      size = this.contents.length;
  return ((oCnt - size)/oCnt * 100).toFixed(2);
};


module.exports = Image;
