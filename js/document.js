
/*
PDFDocument - represents an entire PDF document
By Devon Govett
*/


(function() {
  var PDFDocument, PDFObject, PDFObjectStore, PDFPage, PDFReference, fs;

  fs = require('fs');

  PDFObjectStore = require('./store');

  PDFObject = require('./object');

  PDFReference = require('./reference');

  PDFPage = require('./page');

  PDFDocument = (function() {
    var mixin,
      _this = this;

    function PDFDocument(options) {
      var key, val, _ref;
      this.options = options != null ? options : {};
      this.version = 1.3;
      this.compress = true;
      this.store = new PDFObjectStore;
      this.pages = [];
      this.page = null;
      this.initColor();
      this.initFonts();
      this.initText();
      this.initImages();
      this._info = this.ref({
        Producer: 'PDFKit',
        Creator: 'PDFKit',
        CreationDate: new Date()
      });
      this.info = this._info.data;
      if (this.options.info) {
        _ref = this.options.info;
        for (key in _ref) {
          val = _ref[key];
          this.info[key] = val;
        }
        delete this.options.info;
      }
      this.addPage();
    }

    mixin = function(name) {
      var method, methods, _results;
      methods = require('./mixins/' + name);
      _results = [];
      for (name in methods) {
        method = methods[name];
        _results.push(PDFDocument.prototype[name] = method);
      }
      return _results;
    };

    mixin('color');

    mixin('vector');

    mixin('fonts');

    mixin('text');

    mixin('images');

    mixin('annotations');

    PDFDocument.prototype.addPage = function(options) {
      if (options == null) {
        options = this.options;
      }
      this.page = new PDFPage(this, options);
      this.store.addPage(this.page);
      this.pages.push(this.page);
      this.x = this.page.margins.left;
      this.y = this.page.margins.top;
      if (options.callbackPackage && typeof options.callbackPackage.callback === 'function') {
        options.callbackPackage.callback(this);
      }
      return this;
    };

    PDFDocument.prototype.ref = function(data) {
      return this.store.ref(data);
    };

    PDFDocument.prototype.addContent = function(str) {
      this.page.content.add(str);
      return this;
    };

    PDFDocument.prototype.write = function(filename, fn) {
      return this.output(function(out) {
        return fs.writeFile(filename, out, 'binary', fn);
      });
    };

    PDFDocument.prototype.output = function(fn) {
      var _this = this;
      return this.finalize(function() {
        var out;
        out = [];
        _this.generateHeader(out);
        return _this.generateBody(out, function() {
          _this.generateXRef(out);
          _this.generateTrailer(out);
          return fn(out.join('\n'));
        });
      });
    };

    PDFDocument.prototype.finalize = function(fn) {
      var key, val, _ref,
        _this = this;
      _ref = this.info;
      for (key in _ref) {
        val = _ref[key];
        if (typeof val === 'string') {
          this.info[key] = PDFObject.s(val);
        }
      }
      return this.embedFonts(function() {
        return _this.embedImages(function() {
          var cb, done, page, _i, _len, _ref1, _results;
          done = 0;
          cb = function() {
            if (++done === _this.pages.length) {
              return fn();
            }
          };
          _ref1 = _this.pages;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            page = _ref1[_i];
            _results.push(page.finalize(cb));
          }
          return _results;
        });
      });
    };

    PDFDocument.prototype.generateHeader = function(out) {
      out.push("%PDF-" + this.version);
      out.push("%\xFF\xFF\xFF\xFF\n");
      return out;
    };

    PDFDocument.prototype.generateBody = function(out, fn) {
      var id, offset, proceed, ref, refs,
        _this = this;
      offset = out.join('\n').length;
      refs = (function() {
        var _ref, _results;
        _ref = this.store.objects;
        _results = [];
        for (id in _ref) {
          ref = _ref[id];
          _results.push(ref);
        }
        return _results;
      }).call(this);
      return (proceed = function() {
        if (ref = refs.shift()) {
          return ref.object(_this.compress, function(object) {
            ref.offset = offset;
            out.push(object);
            offset += object.length + 1;
            return proceed();
          });
        } else {
          _this.xref_offset = offset;
          return fn();
        }
      })();
    };

    PDFDocument.prototype.generateXRef = function(out) {
      var id, len, offset, ref, _ref, _results;
      len = this.store.length + 1;
      out.push("xref");
      out.push("0 " + len);
      out.push("0000000000 65535 f ");
      _ref = this.store.objects;
      _results = [];
      for (id in _ref) {
        ref = _ref[id];
        offset = ('0000000000' + ref.offset).slice(-10);
        _results.push(out.push(offset + ' 00000 n '));
      }
      return _results;
    };

    PDFDocument.prototype.generateTrailer = function(out) {
      var trailer;
      trailer = PDFObject.convert({
        Size: this.store.length,
        Root: this.store.root,
        Info: this._info
      });
      out.push('trailer');
      out.push(trailer);
      out.push('startxref');
      out.push(this.xref_offset);
      return out.push('%%EOF');
    };

    PDFDocument.prototype.toString = function() {
      return "[object PDFDocument]";
    };

    return PDFDocument;

  }).call(this);

  module.exports = PDFDocument;

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
