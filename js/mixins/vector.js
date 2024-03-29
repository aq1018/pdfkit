(function() {
  var KAPPA, SVGPath,
    __slice = [].slice;

  SVGPath = require('../path');

  KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);

  module.exports = {
    save: function() {
      return this.addContent('q');
    },
    restore: function() {
      return this.addContent('Q');
    },
    beginPath: function() {
      return this.addContent('m');
    },
    closePath: function() {
      return this.addContent('h');
    },
    lineWidth: function(w) {
      return this.addContent("" + w + " w");
    },
    _CAP_STYLES: {
      BUTT: 0,
      ROUND: 1,
      SQUARE: 2
    },
    lineCap: function(c) {
      if (typeof c === 'string') {
        c = this._CAP_STYLES[c.toUpperCase()];
      }
      return this.addContent("" + c + " J");
    },
    _JOIN_STYLES: {
      MITER: 0,
      ROUND: 1,
      BEVEL: 2
    },
    lineJoin: function(j) {
      if (typeof j === 'string') {
        j = this._JOIN_STYLES[j.toUpperCase()];
      }
      return this.addContent("" + j + " j");
    },
    miterLimit: function(m) {
      return this.addContent("" + m + " M");
    },
    dash: function(length, options) {
      var phase, space;
      if (options == null) {
        options = {};
      }
      if (length == null) {
        return this;
      }
      space = options.space || length;
      phase = options.phase || 0;
      return this.addContent("[" + length + " " + space + "] " + phase + " d");
    },
    undash: function() {
      return this.addContent("[null null] 0 d");
    },
    moveTo: function(x, y) {
      y = this.page.height - y;
      return this.addContent("" + x + " " + y + " m");
    },
    lineTo: function(x, y) {
      y = this.page.height - y;
      return this.addContent("" + x + " " + y + " l");
    },
    bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
      cp1y = this.page.height - cp1y;
      cp2y = this.page.height - cp2y;
      y = this.page.height - y;
      return this.addContent("" + cp1x + " " + cp1y + " " + cp2x + " " + cp2y + " " + x + " " + y + " c");
    },
    quadraticCurveTo: function(cpx, cpy, x, y) {
      cpy = this.page.height - cpy;
      y = this.page.height - y;
      return this.addContent("" + cpx + " " + cpy + " " + x + " " + y + " v");
    },
    rect: function(x, y, w, h) {
      y = this.page.height - y - h;
      return this.addContent("" + x + " " + y + " " + w + " " + h + " re");
    },
    roundedRect: function(x, y, w, h, r) {
      if (r == null) {
        r = 0;
      }
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      return this.quadraticCurveTo(x, y, x + r, y);
    },
    ellipse: function(x, y, r1, r2) {
      var l1, l2;
      if (r2 == null) {
        r2 = r1;
      }
      l1 = r1 * KAPPA;
      l2 = r2 * KAPPA;
      this.moveTo(x + r1, y);
      this.bezierCurveTo(x + r1, y + l1, x + l2, y + r2, x, y + r2);
      this.bezierCurveTo(x - l2, y + r2, x - r1, y + l1, x - r1, y);
      this.bezierCurveTo(x - r1, y - l1, x - l2, y - r2, x, y - r2);
      this.bezierCurveTo(x + l2, y - r2, x + r1, y - l1, x + r1, y);
      return this.moveTo(x, y);
    },
    circle: function(x, y, radius) {
      return this.ellipse(x, y, radius);
    },
    polygon: function() {
      var point, points, _i, _len;
      points = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.moveTo.apply(this, points.shift());
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        point = points[_i];
        this.lineTo.apply(this, point);
      }
      return this.closePath();
    },
    path: function(path) {
      SVGPath.apply(this, path);
      return this;
    },
    _windingRule: function(rule) {
      if (/even-?odd/.test(rule)) {
        return '*';
      }
      return '';
    },
    fill: function(color, rule) {
      if (/(even-?odd)|(non-?zero)/.test(color)) {
        rule = color;
        color = null;
      }
      if (color) {
        this.fillColor(color);
      }
      return this.addContent('f' + this._windingRule(rule));
    },
    stroke: function(color) {
      if (color) {
        this.strokeColor(color);
      }
      return this.addContent('S');
    },
    fillAndStroke: function(fillColor, strokeColor, rule) {
      var isFillRule;
      if (strokeColor == null) {
        strokeColor = fillColor;
      }
      isFillRule = /(even-?odd)|(non-?zero)/;
      if (isFillRule.test(fillColor)) {
        rule = fillColor;
        fillColor = null;
      }
      if (isFillRule.test(strokeColor)) {
        rule = strokeColor;
        strokeColor = fillColor;
      }
      if (fillColor) {
        this.fillColor(fillColor);
        this.strokeColor(strokeColor);
      }
      return this.addContent('B' + this._windingRule(rule));
    },
    clip: function(rule) {
      return this.addContent('W' + this._windingRule(rule) + ' n');
    },
    transform: function(m11, m12, m21, m22, dx, dy) {
      var v, values;
      values = ((function() {
        var _i, _len, _ref, _results;
        _ref = [m11, m12, m21, m22, dx, dy];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          v = _ref[_i];
          _results.push(+v.toFixed(5));
        }
        return _results;
      })()).join(' ');
      return this.addContent("" + values + " cm");
    },
    translate: function(x, y) {
      return this.transform(1, 0, 0, 1, x, -y);
    },
    rotate: function(angle, options) {
      var cos, rad, sin, x, x1, y, y1;
      if (options == null) {
        options = {};
      }
      rad = angle * Math.PI / 180;
      cos = Math.cos(rad);
      sin = Math.sin(rad);
      x = y = 0;
      if (options.origin != null) {
        x = options.origin[0];
        y = this.page.height - options.origin[1];
        x1 = x * cos - y * sin;
        y1 = x * sin + y * cos;
        x -= x1;
        y -= y1;
      }
      return this.transform(cos, sin, -sin, cos, x, y);
    },
    scale: function(factor, options) {
      var x, y;
      if (options == null) {
        options = {};
      }
      x = y = 0;
      if (options.origin != null) {
        x = options.origin[0];
        y = this.page.height - options.origin[1];
        x -= factor * x;
        y -= factor * y;
      }
      return this.transform(factor, 0, 0, factor, x, y);
    }
  };

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
