/*
 * ImageInfo 0.1.2 - A JavaScript library for reading image metadata.
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * MIT License [http://www.nihilogic.dk/licenses/mit-license.txt]
 */


var ImageInfo = {};

ImageInfo.useRange = false;
ImageInfo.range = 10240;

(function() {

  var files = [];

  function readFileData(url, callback) {
    BinaryAjax(
      url,
      function(http) {
        var tags = readInfoFromData(http.binaryResponse);
        var mime = http.getResponseHeader("Content-Type");

        tags["mimeType"] = mime;
        tags["byteSize"] = http.fileSize;

        files[url] = tags;
        if (callback) callback();
      },
      null,
      ImageInfo.useRange ? [0, ImageInfo.range] : null
    )
  }

  function readInfoFromData(data) {

    var offset = 0;

    if (data.getByteAt(0) == 0xFF && data.getByteAt(1) == 0xD8) {
      return readJPEGInfo(data);
    }
    if (data.getByteAt(0) == 0x89 && data.getStringAt(1, 3) == "PNG") {
      return readPNGInfo(data);
    }
    if (data.getStringAt(0,3) == "GIF") {
      return readGIFInfo(data);
    }
    if (data.getByteAt(0) == 0x42 && data.getByteAt(1) == 0x4D) {
      return readBMPInfo(data);
    }
    if (data.getByteAt(0) == 0x00 && data.getByteAt(1) == 0x00) {
      return readICOInfo(data);
    }

    return {
      format : "UNKNOWN"
    };
  }


  function readPNGInfo(data) {
    var w = data.getLongAt(16,true);
    var h = data.getLongAt(20,true);

    var bpc = data.getByteAt(24);
    var ct = data.getByteAt(25);

    var bpp = bpc;
    if (ct == 4) bpp *= 2;
    if (ct == 2) bpp *= 3;
    if (ct == 6) bpp *= 4;

    var alpha = data.getByteAt(25) >= 4;

    return {
      format : "PNG",
      version : "",
      width : w,
      height : h,
      bpp : bpp,
      alpha : alpha,
      exif : {}
    }
  }

  function readGIFInfo(data) {
    var version = data.getStringAt(3,3);
    var w = data.getShortAt(6);
    var h = data.getShortAt(8);

    var bpp = ((data.getByteAt(10) >> 4) & 7) + 1;

    return {
      format : "GIF",
      version : version,
      width : w,
      height : h,
      bpp : bpp,
      alpha : false,
      exif : {}
    }
  }

  function readJPEGInfo(data) {

    var w = 0;
    var h = 0;
    var comps = 0;
    var len = data.getLength();
    var offset = 2;
    while (offset < len) {
      var marker = data.getShortAt(offset, true);
      offset += 2;
      if (marker == 0xFFC0) {
        h = data.getShortAt(offset + 3, true);
        w = data.getShortAt(offset + 5, true);
        comps = data.getByteAt(offset + 7, true)
        break;
      } else {
        offset += data.getShortAt(offset, true)
      }
    }

    var exif = {};

    if (typeof EXIF != "undefined" && EXIF.readFromBinaryFile) {
      exif = EXIF.readFromBinaryFile(data);
    }

    return {
      format : "JPEG",
      version : "",
      width : w,
      height : h,
      bpp : comps * 8,
      alpha : false,
      exif : exif
    }
  }

  function readBMPInfo(data) {
    var w = data.getLongAt(18);
    var h = data.getLongAt(22);
    var bpp = data.getShortAt(28);
    return {
      format : "BMP",
      version : "",
      width : w,
      height : h,
      bpp : bpp,
      alpha : false,
      exif : {}
    }
  }

  ImageInfo.loadInfo = function(url, cb) {
    if (!files[url]) {
      readFileData(url, cb);
    } else {
      if (cb) cb();
    }
  }

  ImageInfo.getAllFields = function(url) {
    if (!files[url]) return null;

    var tags = {};
    for (var a in files[url]) {
      if (files[url].hasOwnProperty(a))
        tags[a] = files[url][a];
    }
    return tags;
  }

  ImageInfo.getField = function(url, field) {
    if (!files[url]) return null;
    return files[url][field];
  }


})();

