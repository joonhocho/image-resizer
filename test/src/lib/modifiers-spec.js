'use strict';

var chai = require('chai'),
  expect = chai.expect,
  sm = require('sandboxed-module'),
  mod = require('../../../src/lib/modifiers');

chai.should();

/* global describe, it */

describe('Modifiers module', function () {

  describe('Original request', function () {
    it('should recognise original', function () {
      mod.parse('original').action.should.equal('original');
    });

    it('should be all lowercase original', function () {
      expect(function () {
        mod.parse('ORIGINAL');
      }).to.throw(Error, 'Invalid modifier');
    });
  });

  // Metadata calls
  describe('Metadata request', function () {
    it('should recognise a metadata call', function () {
      mod.parse('json').action.should.equal('json');
    });

    it('should be all lowercase json', function () {
      expect(function () {
        mod.parse('JSON');
      }).to.throw(Error, 'Invalid modifier');
    });
  });

  // Original image
  describe('No modifiers', function () {
    it('should recognise no modifiers and return original action', function () {
      mod.parse('elocal').action.should.equal('original');
    });

    it('should not return original if there are valid modifiers', function () {
      mod.parse('h500').action.should.not.equal('original');
      mod.parse('h500_gne').action.should.not.equal('original');
    });
  });

  // Gravity
  describe('Gravity', function () {
    it('should read gravity as a modifier string', function () {
      mod.parse('s50_gne').gravity.should.equal('ne');
    });

    it('gravity should be case sensitive', function () {
      expect(function () {
        mod.parse('s50_gNE');
      }).to.throw(Error, 'Invalid gravity');
    });

    it('should not accept a non-valid gravity value', function () {
      expect(function () {
        mod.parse('s50_gnorth');
      }).to.throw(Error, 'Invalid gravity');
    });

    it('should set the action to square', function () {
      mod.parse('s50_gne').action.should.equal('square');
    });

    it('should set the action to crop', function () {
      mod.parse('h400_w600_gse').action.should.equal('crop');
    });
  });

  // Square
  describe('Square', function () {
    it('should set action to square', function () {
      mod.parse('s500').action.should.equal('square');
    });

    it('should set the height and width correctly', function () {
      mod.parse('s500').height.should.equal(500);
      mod.parse('s500').width.should.equal(500);
    });

    it('should not allow a crop value other than the fill', function () {
      mod.parse('s500_gne_cfill').crop.should.equal('fill');
    });
  });

  // Height
  describe('Height requests', function () {
    it('should set the action to resize', function () {
      mod.parse('h400').action.should.equal('resize');
    });
    it('should set the height and leave the width as null', function () {
      var p = mod.parse('h400');
      expect(p.height).to.equal(400);
      expect(p.width).to.be.null;
    });
  });

  // Width
  describe('Width requests', function () {
    it('should set the action to resize', function () {
      mod.parse('w400').action.should.equal('resize');
    });
    it('should set the width and leave the height as null', function () {
      var p = mod.parse('w400');
      expect(p.width).to.equal(400);
      expect(p.height).to.be.null;
    });
  });

  describe('Named modifiers', function () {
    var nm = {
      'small-avatar': {
        'square': 60
      },
      'large-avatar': {
        'square': 120
      },
      'gallery': {
        'height': 400,
        'width': 600
      },
      'thumb': {
        'gravity': 'ne',
        'square': 50,
        'external': 'local'
      }
    };

    it('should read a thumbnail named config and set accordingly', function () {
      var tn = nm.thumb;
      mod.parse('thumb', nm).gravity.should.equal(tn.gravity);
      mod.parse('thumb', nm).height.should.equal(tn.square);
      mod.parse('thumb', nm).width.should.equal(tn.square);
    });

    it('should read a gallery named config and set accordingly', function () {
      var tn = nm.gallery;
      mod.parse('gallery', nm).height.should.equal(tn.height);
      mod.parse('gallery', nm).width.should.equal(tn.width);
    });

  });

});
