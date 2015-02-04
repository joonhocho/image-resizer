/**
Image modifier utilities

Sample modifier strings, separated by a dash

  - /s50/path/to/image.png
  - /s50-gne/path/to/image.png
  - /w300-h200/path/to/image.png
  - /image.jpg
  - /path/to/image.png
  - /json/path/to/image.png


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
var toInt = string.toInt;
var toUInt = string.toUInt;
var endsWith = string.endsWith;
var env = require('../config/environment_vars');
var MOD_SEPARATOR = env.MOD_SEPARATOR || '_';

function toKeys(arr) {
  return arr.reduce(function (obj, key) {
    obj[key] = 1;
    return obj;
  }, {});
}

var modifierMap = [{
  key: 'h',
  desc: 'height',
  type: 'integer',
  parse: function (mods, val) {
    mods.height = val = toUInt(val);
    if (val == null) {
      throw new Error('Invalid height');
    }
  }
}, {
  key: 'w',
  desc: 'width',
  type: 'integer',
  parse: function (mods, val) {
    mods.width = val = toUInt(val);
    if (val == null) {
      throw new Error('Invalid width');
    }
  }
}, {
  key: 's',
  desc: 'square',
  type: 'integer',
  parse: function (mods, val) {
    mods.width = mods.height = val = toUInt(val);
    if (val == null) {
      throw new Error('Invalid value');
    }
    mods.action = 'square';
  }
}, {
  key: 'y',
  desc: 'top',
  type: 'integer',
  parse: function (mods, val) {
    mods.y = val = toInt(val);
    if (val == null) {
      throw new Error('Invalid y');
    }
  }
}, {
  key: 'x',
  desc: 'left',
  type: 'integer',
  parse: function (mods, val) {
    mods.x = val = toInt(val);
    if (val == null) {
      throw new Error('Invalid y');
    }
  }
}, {
  key: 'g',
  desc: 'gravity',
  type: 'string',
  values: toKeys('c n s e w ne nw se sw'.split(' ')),
  'default': 'c',
  parse: function (mods, val) {
    if (this.values[val] === 1) {
      mods.gravity = val;
    }
    else {
      throw new Error('Invalid gravity');
    }
  }
}, {
  key: 'c',
  desc: 'crop',
  type: 'string',
  values: toKeys('fit fill cut scale'.split(' ')),
  'default': 'fit',
  parse: function (mods, val) {
    if (this.values[val] === 1) {
      mods.crop = val;
    }
    else {
      throw new Error('Invalid crop');
    }
  }
}, {
  key: 'e',
  desc: 'external',
  type: 'string',
  values: toKeys(Object.keys(require('../streams/sources'))),
  'default': env.DEFAULT_SOURCE,
  parse: function (mods, val) {
    if (this.values[val] === 1) {
      mods.external = val;
    }
    else {
      throw new Error('Invalid source');
    }
  }
}, {
  key: 'f',
  desc: 'filter',
  type: 'string',
  values: toKeys(Object.keys(require('../streams/filters'))),
  parse: function (mods, val) {
    if (this.values[val] === 1) {
      mods.filter = val;
    }
    else {
      throw new Error('Invalid source');
    }
  }
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
    var val = item.substr(1);

    // get the modifier object that responds to the listed key
    var mod = modifiersByKey[key];
    if (mod) {
      mod.parse(mods, val);
    }
    else {
      throw new Error('Invalid modifier');
    }
  });
}

// Exposed method to parse an incoming URL for modifiers, can add a map of
// named (preset) modifiers if need be (mostly just for unit testing). Named
// modifiers are usually added via config json file in root of application.
exports.parse = function (urlParts, namedMods) {
  if (typeof urlParts === 'string') {
    urlParts = urlParts.replace(/^\//, '').split('/');
  }
  namedMods = namedMods || namedModifierMap;

  var gravity = modifiersByKey.g;
  var crop = modifiersByKey.c;

  // set the mod keys and defaults
  var mods = {
    action: 'original',
    height: null,
    width: null,
    gravity: gravity.default,
    crop: crop.default
  };

  // check the request to see if it includes a named modifier
  var modStr = urlParts[0];
  if (modStr === 'json' || modStr === 'original') {
    mods.action = modStr;
    return mods;
  }

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
  else if (!env.NAMED_MODIFIERS_ONLY) {
    // check the request for available modifiers, unless we are restricting to
    // only named modifiers.
    parseModifiers(mods, modStr.split(MOD_SEPARATOR));
  }
  else {
    throw new Error('Invalid modifier');
  }

  if (mods.action === 'square') {
    // make sure crop is set to the default
    mods.crop = 'fill';
  }
  else if (mods.height != null || mods.width != null) {
    if (mods.crop !== crop.default || mods.gravity !== gravity.default || mods.x != null || mods.y != null) {
      mods.action = 'crop';
    }
    else {
      mods.action = 'resize';
    }
  }

  return mods;
};
