'use strict';

var vars = {
  NODE_ENV: 'development',
  PORT: 3001,
  DEFAULT_SOURCE: 's3',
  EXCLUDE_SOURCES: null, // add comma delimited list

  // Restrict to named modifiers strings only
  NAMED_MODIFIERS_ONLY: false,
  MOD_SEPARATOR: '_',

  // AWS keys
  AWS_ACCESS_KEY_ID: null,
  AWS_SECRET_ACCESS_KEY: null,
  AWS_REGION: null,
  S3_BUCKET: null,

  // Resize options
  RESIZE_PROCESS_ORIGINAL: true,
  AUTO_ORIENT: true,
  REMOVE_METADATA: true,

  // Optimization options
  JPEG_PROGRESSIVE: true,
  PNG_OPTIMIZER: 'pngquant',
  PNG_OPTIMIZATION: 2,
  GIF_INTERLACED: true,
  IMAGE_QUALITY: 60,
  IMAGE_PROGRESSIVE: true,

  // Cache expiries
  IMAGE_EXPIRY: 60 * 60 * 24 * 90,
  IMAGE_EXPIRY_SHORT: 60 * 60 * 24 * 2,
  JSON_EXPIRY: 60 * 60 * 24 * 30,

  // Logging options
  LOG_PREFIX: 'resizer',
  QUEUE_LOG: true,

  // Response settings
  CACHE_DEV_REQUESTS: false,

  // Twitter settings
  TWITTER_CONSUMER_KEY: null,
  TWITTER_CONSUMER_SECRET: null,
  TWITTER_ACCESS_TOKEN: null,
  TWITTER_ACCESS_TOKEN_SECRET: null,

  // Where are the local files kept?
  LOCAL_FILE_PATH: process.cwd()
};

Object.keys(vars).forEach(function (key) {
  if (process.env.hasOwnProperty(key)) {
    vars[key] = process.env[key];
  }

  // cast any boolean strings to proper boolean values
  if (vars[key] === 'true') {
    vars[key] = true;
  }
  else if (vars[key] === 'false') {
    vars[key] = false;
  }
});

// A few helpers to quickly determine the environment
vars.development = vars.NODE_ENV === 'development';
vars.test = vars.NODE_ENV === 'test';
vars.production = vars.NODE_ENV === 'production';

module.exports = vars;
