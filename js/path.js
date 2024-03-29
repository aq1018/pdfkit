(function() {
  var SVGPath;

  SVGPath = (function() {
    var apply, arcToSegments, cx, cy, parameters, parse, px, py, runners, segmentToBezier, solveArc, sx, sy;

    function SVGPath() {}

    SVGPath.apply = function(doc, path) {
      var commands;
      commands = parse(path);
      return apply(commands, doc);
    };

    parameters = {
      A: 7,
      a: 7,
      C: 6,
      c: 6,
      H: 1,
      h: 1,
      L: 2,
      l: 2,
      M: 2,
      m: 2,
      Q: 4,
      q: 4,
      S: 4,
      s: 4,
      T: 2,
      t: 2,
      V: 1,
      v: 1,
      Z: 0,
      z: 0
    };

    parse = function(path) {
      var args, c, cmd, curArg, foundDecimal, params, ret, _i, _len;
      ret = [];
      args = [];
      curArg = "";
      foundDecimal = false;
      params = 0;
      for (_i = 0, _len = path.length; _i < _len; _i++) {
        c = path[_i];
        if (parameters[c] != null) {
          params = parameters[c];
          if (cmd) {
            if (curArg.length > 0) {
              args[args.length] = +curArg;
            }
            ret[ret.length] = {
              cmd: cmd,
              args: args
            };
            args = [];
            curArg = "";
            foundDecimal = false;
          }
          cmd = c;
        } else if ((c === " " || c === ",") || (c === "-" && curArg.length > 0) || (c === "." && foundDecimal)) {
          if (curArg.length === 0) {
            continue;
          }
          if (args.length === params) {
            ret[ret.length] = {
              cmd: cmd,
              args: args
            };
            args = [+curArg];
            if (cmd === "M") {
              cmd = "L";
            }
            if (cmd === "m") {
              cmd = "l";
            }
          } else {
            args[args.length] = +curArg;
          }
          foundDecimal = c === ".";
          curArg = c === '-' || c === '.' ? c : '';
        } else {
          curArg += c;
          if (c === '.') {
            foundDecimal = true;
          }
        }
      }
      if (curArg.length > 0) {
        args[args.length] = +curArg;
      }
      ret[ret.length] = {
        cmd: cmd,
        args: args
      };
      return ret;
    };

    cx = cy = px = py = sx = sy = 0;

    apply = function(commands, doc) {
      var c, i, _i, _len, _name;
      cx = cy = px = py = sx = sy = 0;
      for (i = _i = 0, _len = commands.length; _i < _len; i = ++_i) {
        c = commands[i];
        if (typeof runners[_name = c.cmd] === "function") {
          runners[_name](doc, c.args);
        }
      }
      return cx = cy = px = py = 0;
    };

    runners = {
      M: function(doc, a) {
        cx = a[0];
        cy = a[1];
        px = py = null;
        sx = cx;
        sy = cy;
        return doc.moveTo(cx, cy);
      },
      m: function(doc, a) {
        cx += a[0];
        cy += a[1];
        px = py = null;
        sx = cx;
        sy = cy;
        return doc.moveTo(cx, cy);
      },
      C: function(doc, a) {
        cx = a[4];
        cy = a[5];
        px = a[2];
        py = a[3];
        return doc.bezierCurveTo.apply(doc, a);
      },
      c: function(doc, a) {
        doc.bezierCurveTo(a[0] + cx, a[1] + cy, a[2] + cx, a[3] + cy, a[4] + cx, a[5] + cy);
        px = cx + a[2];
        py = cy + a[3];
        cx += a[4];
        return cy += a[5];
      },
      S: function(doc, a) {
        if (px === null) {
          px = cx;
          py = cy;
        }
        doc.bezierCurveTo(cx - (px - cx), cy - (py - cy), a[0], a[1], a[2], a[3]);
        px = a[0];
        py = a[1];
        cx = a[2];
        return cy = a[3];
      },
      s: function(doc, a) {
        doc.bezierCurveTo(cx - (px - cx), cy - (py - cy), cx + a[0], cy + a[1], cx + a[2], cy + a[3]);
        px = cx + a[0];
        py = cy + a[1];
        cx += a[2];
        return cy += a[3];
      },
      Q: function(doc, a) {
        px = a[0];
        py = a[1];
        cx = a[2];
        cy = a[3];
        return doc.quadraticCurveTo(a[0], a[1], cx, cy);
      },
      q: function(doc, a) {
        doc.quadraticCurveTo(a[0] + cx, a[1] + cy, a[2] + cx, a[3] + cy);
        px = cx + a[0];
        py = cy + a[1];
        cx += a[2];
        return cy += a[3];
      },
      T: function(doc, a) {
        if (px === null) {
          px = cx;
          py = cy;
        } else {
          px = cx - (px - cx);
          py = cy - (py - cy);
        }
        doc.quadraticCurveTo(px, py, a[0], a[1]);
        px = cx - (px - cx);
        py = cy - (py - cy);
        cx = a[0];
        return cy = a[1];
      },
      t: function(doc, a) {
        if (px === null) {
          px = cx;
          py = cy;
        } else {
          px = cx - (px - cx);
          py = cy - (py - cy);
        }
        doc.quadraticCurveTo(px, py, cx + a[0], cy + a[1]);
        cx += a[0];
        return cy += a[1];
      },
      A: function(doc, a) {
        solveArc(doc, cx, cy, a);
        cx = a[5];
        return cy = a[6];
      },
      a: function(doc, a) {
        a[5] += cx;
        a[6] += cy;
        solveArc(doc, cx, cy, a);
        cx = a[5];
        return cy = a[6];
      },
      L: function(doc, a) {
        cx = a[0];
        cy = a[1];
        px = py = null;
        return doc.lineTo(cx, cy);
      },
      l: function(doc, a) {
        cx += a[0];
        cy += a[1];
        px = py = null;
        return doc.lineTo(cx, cy);
      },
      H: function(doc, a) {
        cx = a[0];
        px = py = null;
        return doc.lineTo(cx, cy);
      },
      h: function(doc, a) {
        cx += a[0];
        px = py = null;
        return doc.lineTo(cx, cy);
      },
      V: function(doc, a) {
        cy = a[0];
        px = py = null;
        return doc.lineTo(cx, cy);
      },
      v: function(doc, a) {
        cy += a[0];
        px = py = null;
        return doc.lineTo(cx, cy);
      },
      Z: function(doc) {
        doc.closePath();
        cx = sx;
        return cy = sy;
      },
      z: function(doc) {
        doc.closePath();
        cx = sx;
        return cy = sy;
      }
    };

    solveArc = function(doc, x, y, coords) {
      var bez, ex, ey, large, rot, rx, ry, seg, segs, sweep, _i, _len, _results;
      rx = coords[0], ry = coords[1], rot = coords[2], large = coords[3], sweep = coords[4], ex = coords[5], ey = coords[6];
      segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
      _results = [];
      for (_i = 0, _len = segs.length; _i < _len; _i++) {
        seg = segs[_i];
        bez = segmentToBezier.apply(null, seg);
        _results.push(doc.bezierCurveTo.apply(doc, bez));
      }
      return _results;
    };

    arcToSegments = function(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
      var a00, a01, a10, a11, cos_th, d, i, pl, result, segments, sfactor, sfactor_sq, sin_th, th, th0, th1, th2, th3, th_arc, x0, x1, xc, y0, y1, yc, _i;
      th = rotateX * (Math.PI / 180);
      sin_th = Math.sin(th);
      cos_th = Math.cos(th);
      rx = Math.abs(rx);
      ry = Math.abs(ry);
      px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
      py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
      pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);
      if (pl > 1) {
        pl = Math.sqrt(pl);
        rx *= pl;
        ry *= pl;
      }
      a00 = cos_th / rx;
      a01 = sin_th / rx;
      a10 = (-sin_th) / ry;
      a11 = cos_th / ry;
      x0 = a00 * ox + a01 * oy;
      y0 = a10 * ox + a11 * oy;
      x1 = a00 * x + a01 * y;
      y1 = a10 * x + a11 * y;
      d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
      sfactor_sq = 1 / d - 0.25;
      if (sfactor_sq < 0) {
        sfactor_sq = 0;
      }
      sfactor = Math.sqrt(sfactor_sq);
      if (sweep === large) {
        sfactor = -sfactor;
      }
      xc = 0.5 * (x0 + x1) - sfactor * (y1 - y0);
      yc = 0.5 * (y0 + y1) + sfactor * (x1 - x0);
      th0 = Math.atan2(y0 - yc, x0 - xc);
      th1 = Math.atan2(y1 - yc, x1 - xc);
      th_arc = th1 - th0;
      if (th_arc < 0 && sweep === 1) {
        th_arc += 2 * Math.PI;
      } else if (th_arc > 0 && sweep === 0) {
        th_arc -= 2 * Math.PI;
      }
      segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
      result = [];
      for (i = _i = 0; 0 <= segments ? _i < segments : _i > segments; i = 0 <= segments ? ++_i : --_i) {
        th2 = th0 + i * th_arc / segments;
        th3 = th0 + (i + 1) * th_arc / segments;
        result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
      }
      return result;
    };

    segmentToBezier = function(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
      var a00, a01, a10, a11, t, th_half, x1, x2, x3, y1, y2, y3;
      a00 = cos_th * rx;
      a01 = -sin_th * ry;
      a10 = sin_th * rx;
      a11 = cos_th * ry;
      th_half = 0.5 * (th1 - th0);
      t = (8 / 3) * Math.sin(th_half * 0.5) * Math.sin(th_half * 0.5) / Math.sin(th_half);
      x1 = cx + Math.cos(th0) - t * Math.sin(th0);
      y1 = cy + Math.sin(th0) + t * Math.cos(th0);
      x3 = cx + Math.cos(th1);
      y3 = cy + Math.sin(th1);
      x2 = x3 + t * Math.sin(th1);
      y2 = y3 - t * Math.cos(th1);
      return [a00 * x1 + a01 * y1, a10 * x1 + a11 * y1, a00 * x2 + a01 * y2, a10 * x2 + a11 * y2, a00 * x3 + a01 * y3, a10 * x3 + a11 * y3];
    };

    return SVGPath;

  })();

  module.exports = SVGPath;

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
