(function() {
  var CmapEntry, CmapTable, Data, Table,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Table = require('../table');

  Data = require('../../data');

  CmapTable = (function(_super) {

    __extends(CmapTable, _super);

    function CmapTable() {
      CmapTable.__super__.constructor.apply(this, arguments);
    }

    CmapTable.prototype.parse = function(data) {
      var entry, i, tableCount, _i, _ref;
      data.pos = this.offset;
      this.version = data.readUInt16();
      tableCount = data.readUInt16();
      this.tables = [];
      this.unicode = null;
      for (i = _i = 0; 0 <= tableCount ? _i < tableCount : _i > tableCount; i = 0 <= tableCount ? ++_i : --_i) {
        entry = new CmapEntry(data, this.offset);
        this.tables.push(entry);
        if (entry.isUnicode) {
          if ((_ref = this.unicode) == null) {
            this.unicode = entry;
          }
        }
      }
      return true;
    };

    CmapTable.encode = function(charmap, encoding) {
      var result, table;
      if (encoding == null) {
        encoding = 'macroman';
      }
      result = CmapEntry.encode(charmap, encoding);
      table = new Data;
      table.writeUInt16(0);
      table.writeUInt16(1);
      result.table = table.data.concat(result.subtable);
      return result;
    };

    return CmapTable;

  })(Table);

  CmapEntry = (function() {

    function CmapEntry(data, offset) {
      var code, count, endCode, glyphId, glyphIds, i, idDelta, idRangeOffset, index, segCount, segCountX2, start, startCode, tail, _i, _j, _k, _len;
      this.platformID = data.readUInt16();
      this.encodingID = data.readShort();
      this.offset = offset + data.readInt();
      data.pos = this.offset;
      this.format = data.readUInt16();
      this.length = data.readUInt16();
      this.language = data.readUInt16();
      this.isUnicode = (this.platformID === 3 && this.encodingID === 1 && this.format === 4) || this.platformID === 0 && this.format === 4;
      this.codeMap = {};
      switch (this.format) {
        case 0:
          for (i = _i = 0; _i < 256; i = ++_i) {
            this.codeMap[i] = data.readByte();
          }
          break;
        case 4:
          segCountX2 = data.readUInt16();
          segCount = segCountX2 / 2;
          data.pos += 6;
          endCode = (function() {
            var _j, _results;
            _results = [];
            for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          data.pos += 2;
          startCode = (function() {
            var _j, _results;
            _results = [];
            for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          idDelta = (function() {
            var _j, _results;
            _results = [];
            for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          idRangeOffset = (function() {
            var _j, _results;
            _results = [];
            for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          count = this.length - data.pos + this.offset;
          glyphIds = (function() {
            var _j, _results;
            _results = [];
            for (i = _j = 0; 0 <= count ? _j < count : _j > count; i = 0 <= count ? ++_j : --_j) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          for (i = _j = 0, _len = endCode.length; _j < _len; i = ++_j) {
            tail = endCode[i];
            start = startCode[i];
            for (code = _k = start; start <= tail ? _k <= tail : _k >= tail; code = start <= tail ? ++_k : --_k) {
              if (idRangeOffset[i] === 0) {
                glyphId = code + idDelta[i];
              } else {
                index = idRangeOffset[i] / 2 + (code - start) - (segCount - i);
                glyphId = glyphIds[index] || 0;
                if (glyphId !== 0) {
                  glyphId += idDelta[i];
                }
              }
              this.codeMap[code] = glyphId & 0xFFFF;
            }
          }
      }
    }

    CmapEntry.encode = function(charmap, encoding) {
      var charMap, code, codeMap, codes, delta, deltas, diff, endCode, endCodes, entrySelector, glyphIDs, i, id, indexes, last, map, nextID, offset, old, rangeOffsets, rangeShift, result, searchRange, segCount, segCountX2, startCode, startCodes, startGlyph, subtable, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _name, _o, _p, _q, _ref, _ref1;
      subtable = new Data;
      codes = Object.keys(charmap).sort(function(a, b) {
        return a - b;
      });
      switch (encoding) {
        case 'macroman':
          id = 0;
          indexes = (function() {
            var _i, _results;
            _results = [];
            for (i = _i = 0; _i < 256; i = ++_i) {
              _results.push(0);
            }
            return _results;
          })();
          map = {
            0: 0
          };
          codeMap = {};
          for (_i = 0, _len = codes.length; _i < _len; _i++) {
            code = codes[_i];
            if ((_ref = map[_name = charmap[code]]) == null) {
              map[_name] = ++id;
            }
            codeMap[code] = {
              old: charmap[code],
              "new": map[charmap[code]]
            };
            indexes[code] = map[charmap[code]];
          }
          subtable.writeUInt16(1);
          subtable.writeUInt16(0);
          subtable.writeUInt32(12);
          subtable.writeUInt16(0);
          subtable.writeUInt16(262);
          subtable.writeUInt16(0);
          subtable.write(indexes);
          return result = {
            charMap: codeMap,
            subtable: subtable.data,
            maxGlyphID: id + 1
          };
        case 'unicode':
          startCodes = [];
          endCodes = [];
          nextID = 0;
          map = {};
          charMap = {};
          last = diff = null;
          for (_j = 0, _len1 = codes.length; _j < _len1; _j++) {
            code = codes[_j];
            old = charmap[code];
            if ((_ref1 = map[old]) == null) {
              map[old] = ++nextID;
            }
            charMap[code] = {
              old: old,
              "new": map[old]
            };
            delta = map[old] - code;
            if ((last == null) || delta !== diff) {
              if (last) {
                endCodes.push(last);
              }
              startCodes.push(code);
              diff = delta;
            }
            last = code;
          }
          if (last) {
            endCodes.push(last);
          }
          endCodes.push(0xFFFF);
          startCodes.push(0xFFFF);
          segCount = startCodes.length;
          segCountX2 = segCount * 2;
          searchRange = 2 * Math.pow(Math.log(segCount) / Math.LN2, 2);
          entrySelector = Math.log(searchRange / 2) / Math.LN2;
          rangeShift = 2 * segCount - searchRange;
          deltas = [];
          rangeOffsets = [];
          glyphIDs = [];
          for (i = _k = 0, _len2 = startCodes.length; _k < _len2; i = ++_k) {
            startCode = startCodes[i];
            endCode = endCodes[i];
            if (startCode === 0xFFFF) {
              deltas.push(0);
              rangeOffsets.push(0);
              break;
            }
            startGlyph = charMap[startCode]["new"];
            if (startCode - startGlyph >= 0x8000) {
              deltas.push(0);
              rangeOffsets.push(2 * (glyphIDs.length + segCount - i));
              for (code = _l = startCode; startCode <= endCode ? _l <= endCode : _l >= endCode; code = startCode <= endCode ? ++_l : --_l) {
                glyphIDs.push(charMap[code]["new"]);
              }
            } else {
              deltas.push(startGlyph - startCode);
              rangeOffsets.push(0);
            }
          }
          subtable.writeUInt16(3);
          subtable.writeUInt16(1);
          subtable.writeUInt32(12);
          subtable.writeUInt16(4);
          subtable.writeUInt16(16 + segCount * 8 + glyphIDs.length * 2);
          subtable.writeUInt16(0);
          subtable.writeUInt16(segCountX2);
          subtable.writeUInt16(searchRange);
          subtable.writeUInt16(entrySelector);
          subtable.writeUInt16(rangeShift);
          for (_m = 0, _len3 = endCodes.length; _m < _len3; _m++) {
            code = endCodes[_m];
            subtable.writeUInt16(code);
          }
          subtable.writeUInt16(0);
          for (_n = 0, _len4 = startCodes.length; _n < _len4; _n++) {
            code = startCodes[_n];
            subtable.writeUInt16(code);
          }
          for (_o = 0, _len5 = deltas.length; _o < _len5; _o++) {
            delta = deltas[_o];
            subtable.writeUInt16(delta);
          }
          for (_p = 0, _len6 = rangeOffsets.length; _p < _len6; _p++) {
            offset = rangeOffsets[_p];
            subtable.writeUInt16(offset);
          }
          for (_q = 0, _len7 = glyphIDs.length; _q < _len7; _q++) {
            id = glyphIDs[_q];
            subtable.writeUInt16(id);
          }
          return result = {
            charMap: charMap,
            subtable: subtable.data,
            maxGlyphID: nextID + 1
          };
      }
    };

    return CmapEntry;

  })();

  module.exports = CmapTable;

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
