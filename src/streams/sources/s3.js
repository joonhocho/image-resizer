'use strict';

var env, s3, stream, util, client, bucket;

env    = require('../../config/environment_vars');
s3     = require('aws-sdk').S3;
stream = require('stream');
util   = require('util');

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
} catch(e) {
  console.error(Date.now(), 'new aws.s3');
}


function s3Stream(image){
  /* jshint validthis:true */
  if (!(this instanceof s3Stream)){
    return new s3Stream(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;
  console.log(Date.now(), 'done new s3Stream');
}

util.inherits(s3Stream, stream.Readable);

s3Stream.prototype._read = function(){
  console.log(Date.now(), 's3Stream._read', {
    ended: this.ended,
    error: this.image.isError()
  });
  var _this = this;

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  // Set the AWS options
  var awsOptions = {
    Bucket: bucket,
    Key: this.image.path.replace(/^\//,'')
  };

  console.log(Date.now(), 's3Stream._read s3', awsOptions);
  this.image.log.time('s3');

  client.getObject(awsOptions, function(err, data){
    _this.image.log.timeEnd('s3');

    // if there is an error store it on the image object and pass it along
    if (err) {
      console.error(Date.now(), 's3.getObject', err);
      _this.image.error = new Error(err);
    }

    // if not store the image buffer
    else {
      _this.image.contents = data.Body;
      _this.image.originalContentLength = data.Body.length;
      console.log(Date.now(), 's3.getObject', data.Body.length);
    }

    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });
  console.log(Date.now(), 'async s3.getObject');
};


module.exports = s3Stream;
