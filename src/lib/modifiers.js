/**
Image modifier utilities

Sample modifier strings, separated by a dash

  - /s50/path/to/image.png
  - /s50-gne/path/to/image.png
  - /w300-h200/path/to/image.png
  - /image.jpg
  - /path/to/image.png
  - /path/to/image.png.json


Supported modifiers are:

  - height:       eg. h500
  - width:        eg. w200
  - square:       eg. s50
  - crop:         eg. cfill
  - top:          eg. y12
  - left:         eg. x200
  - gravity:      eg. gs, gne
  - filter:       eg. fsepia
  - external:     eg. efacebook

Crop modifiers:
  fit
     - maintain original proportions
     - resize so image fits wholly into new dimensions
         - eg: h400-w500 - 400x600 -> 333x500
     - default option
  fill
     - maintain original proportions
     - resize via smallest dimension, crop the largest
     - crop image all dimensions that dont fit
         - eg: h400-w500 - 400x600 -> 400x500
  cut
     - maintain original proportions
     - no resize, crop to gravity or x/y
  scale
     - do not maintain original proportions
     - force image to be new dimensions (squishing the image)

*/
'use strict';

var string = require('../utils/string');
var sanitize = string.sanitize;
var endsWith = string.endsWith;
var env = require('../config/environment_vars');

function toKeys(arr) {
  return arr.reduce(function (obj, key) {
    obj[key] = 1;
    return obj;
  }, {});
}

var modifierMap = [{
  key: 'h',
  desc: 'height',
  type: 'integer'
}, {
  key: 'w',
  desc: 'width',
  type: 'integer'
}, {
  key: 's',
  desc: 'square',
  type: 'integer'
}, {
  key: 'y',
  desc: 'top',
  type: 'integer'
}, {
  key: 'x',
  desc: 'left',
  type: 'integer'
}, {
  key: 'g',
  desc: 'gravity',
  type: 'string',
  values: toKeys('c,n,s,e,w,ne,nw,se,sw'.split(',')),
  'default': 'c'
}, {
  key: 'c',
  desc: 'crop',
  type: 'string',
  values: toKeys('fit,fill,cut,scale'.split(',')),
  'default': 'fit'
}, {
  key: 'e',
  desc: 'external',
  type: 'string',
  values: toKeys(Object.keys(require('../streams/sources'))),
  'default': env.DEFAULT_SOURCE
}, {
  key: 'f',
  desc: 'filter',
  type: 'string',
  values: toKeys(Object.keys(require('../streams/filters')))
}];

exports.map = modifierMap;

var modifiersByKey = modifierMap.reduce(function (obj, mod) {
  obj[mod.key] = mod;
  return obj;
}, {});

exports.mod = function (key) {
  return modifiersByKey[key] || null;
};

var namedModifierMap = (function () {
  // Check to see if there is a config file of named modifier aliases
  var fs = require('fs');
  var namedModifiersPath = process.cwd() + '/named_modifiers.json';
  if (fs.existsSync(namedModifiersPath)) {
    return JSON.parse(fs.readFileSync(namedModifiersPath));
  }
  return null;
})();

// Take an array of modifiers and parse the keys and values into mods hash
function parseModifiers(mods, modArr) {
  modArr.forEach(function (item) {
    var key = item[0];
    var value = item.slice(1);

    // get the modifier object that responds to the listed key
    var mod = modifiersByKey[key];
    if (mod) {

      switch (mod.desc) {
      case 'height':
        mods.height = sanitize(value);
        break;
      case 'width':
        mods.width = sanitize(value);
        break;
      case 'square':
        mods.action = 'square';
        mods.height = sanitize(value);
        mods.width = sanitize(value);
        break;
      case 'gravity':
        value = sanitize(value, 'alpha').toLowerCase();
        if (mod.values[value] === 1) {
          mods.gravity = value;
        }
        break;
      case 'top':
        mods.y = sanitize(value);
        break;
      case 'left':
        mods.x = sanitize(value);
        break;
      case 'crop':
        value = sanitize(value, 'alpha').toLowerCase();
        if (mod.values[value] === 1) {
          mods.crop = value;
        }
        break;
      case 'external':
        value = sanitize(value, 'alphanumeric').toLowerCase();
        if (mod.values[value] === 1) {
          mods.external = value;
        }
        break;
      case 'filter':
        value = sanitize(value, 'alpha').toLowerCase();
        if (mod.values[value] === 1) {
          mods.filter = value;
        }
        break;
      }
    }

  });

  return mods;
}

// Exposed method to parse an incoming URL for modifiers, can add a map of
// named (preset) modifiers if need be (mostly just for unit testing). Named
// modifiers are usually added via config json file in root of application.
exports.parse = function (requestUrl, namedMods) {
  namedMods = namedMods || namedModifierMap;

  var gravity = modifiersByKey.g;
  var crop = modifiersByKey.c;
  var segments = requestUrl.replace(/^\//, '').split('/');
  var modStr = segments[0];
  var image = segments[segments.length - 1].toLowerCase();

  // set the mod keys and defaults
  var mods = {
    action: 'original',
    height: null,
    width: null,
    gravity: gravity.default,
    crop: crop.default
  };

  // check the request to see if it includes a named modifier
  var mod = namedMods && namedMods[modStr];
  if (mod) {
    Object.keys(mod).forEach(function (key) {
      var value = mod[key];
      if (key === 'square') {
        mods.action = 'square';
        mods.height = value;
        mods.width = value;
      }
      else {
        mods[key] = value;
      }
    });
  }

  // check the request for available modifiers, unless we are restricting to
  // only named modifiers.
  if (!env.NAMED_MODIFIERS_ONLY) {
    mods = parseModifiers(mods, modStr.split('-'));
  }

  // check to see if this a metadata call, it trumps all other requested mods
  if (endsWith(image, '.json')) {
    mods.action = 'json';
    return mods;
  }

  if (mods.action === 'square') {
    // make sure crop is set to the default
    mods.crop = 'fill';
    return mods;
  }

  if (mods.height != null || mods.width != null) {
    mods.action = 'resize';

    if (mods.crop !== crop.default) {
      mods.action = 'crop';
    }
    else if (mods.gravity !== gravity.default) {
      mods.action = 'crop';
    }
    else if (mods.x != null || mods.y != null) {
      mods.action = 'crop';
    }
  }

  return mods;
};
