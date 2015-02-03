'use strict';

var env = require('../../config/environment_vars');
var s3 = require('aws-sdk').S3;
var Readable = require('stream').Readable;
var util = require('util');

var client, bucket;
try {
  console.log(Date.now(), 'new aws.s3', env.AWS_ACCESS_KEY_ID, env.AWS_REGION);
  // create an AWS S3 client with the config data
  client = new s3({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION
  });
  bucket = env.S3_BUCKET;
  console.log(Date.now(), 'done new aws.s3', bucket);
}
catch (e) {
  console.error(Date.now(), 'error new aws.s3', e);
}

function s3Stream(image) {
  /* jshint validthis:true */
  if (!(this instanceof s3Stream)) {
    return new s3Stream(image);
  }

  Readable.call(this, {
    objectMode: true
  });

  this.image = image;
  this.ended = false;
  console.log(Date.now(), 'done new s3Stream');
}
util.inherits(s3Stream, Readable);

s3Stream.prototype._read = function () {
  console.log(Date.now(), 's3Stream._read', {
    ended: this.ended,
    error: this.image.isError()
  });

  if (this.ended) {
    return;
  }

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image, null);
    return;
  }

  // Set the AWS options
  var awsOptions = {
    Bucket: bucket,
    Key: this.image.path.replace(/^\//, '')
  };

  console.log(Date.now(), 's3Stream._read s3', awsOptions);
  this.image.log.time('s3');

  client.getObject(awsOptions, this._onGetObject.bind(this));
  console.log(Date.now(), 'async s3.getObject');
};

s3Stream.prototype._onGetObject = function (err, data) {
  this.image.log.timeEnd('s3');

  if (err) {
    // if there is an error store it on the image object and pass it along
    console.error(Date.now(), 's3.getObject', err);
    this.image.error = err;
  }
  else {
    // if not store the image buffer
    var body = data.Body;
    this.image.contents = body;
    this.image.originalContentLength = body.length;
    console.log(Date.now(), 's3.getObject', body.length);
  }

  this.ended = true;
  this.push(this.image, null);
};

module.exports = s3Stream;
