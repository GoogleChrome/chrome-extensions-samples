var vendorId = 0x0922;
var productId = 0x0020;

var ESC = 0x1B;
var SYN = 0x16;

var pageWidth = 304;  // pixels (must be multiple of 8)
var pageHeight = 900; // pixels


var $ = function(id) { return document.getElementById(id); };
var $$ = function(selector) { return document.querySelector(selector); };

var resetSequence = // 156 times ESC
   [ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC,
    ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC, ESC];

// should set the resolution to 204x204ppi, but the resolution I get is more
// like 290x580, not sure what's up with that.
var setResolution = [ESC, 0x79];
// some more seemingly required setup stuff
var tabData = [ESC, 0x51, 0, 0, ESC, 42, 0];
var qualityData = [ESC, 0x69]; // images
var densityData = [ESC, 0x65]; // normal
var lengthData = [ESC, 0x4C,  0x40, 0x00]; // not sure what this is about...

var startDoc = resetSequence.concat(setResolution, tabData, qualityData,
                                    densityData, lengthData);
var endDoc = [ESC, 0x45]; // Form feed

var logoImg = new Image();
logoImg.src = "chrome_logo.png";


function requestPermission(callback) {
  chrome.permissions.request(
    {permissions: [{'usbDevices': [{"vendorId": vendorId, "productId": productId}] }]}
    , function(result) {
    if (result) {
      callback();
    } else {
      console.log('App was not granted the "usbDevices" permission.');
      console.log(chrome.runtime.lastError);
    }
  });
}


function printCanvas() {
  var onDeviceFound = function(devices) {
    if (devices && devices.length>0) {
      device = devices[0];
      console.log("Device found: " + device.handle);

      var ctx = document.getElementById('ditheredCanvas').getContext('2d');
      var img = ctx.getImageData(0, 0, pageHeight, pageWidth);

      var dataBytesPerLine = pageWidth / 8;

      // every row of the image results in 2 rows of pixels to be printed, both
      // with one extra byte in front of it
      var bytesPerRow = (dataBytesPerLine + 1) * 2;

      var bytesForImage = bytesPerRow * pageHeight;
      // Total size is the size of all the data + the prefix and suffix
      // and 3 bytes to set the line size
      var totalDataSize = bytesForImage + startDoc.length + endDoc.length + 3;

      var data = new ArrayBuffer(totalDataSize);
      var dataView = new Uint8Array(data, 0, totalDataSize);

      // Set beginning data
      dataView.set(startDoc, 0);
      var offset = startDoc.length;
      // Set Bytes Per Line
      dataView.set([ESC, 0x44, dataBytesPerLine], offset);
      offset += 3;

      for (var x = 0; x < img.width; x++) {
        var off1 = offset;
        var off2 = offset + dataBytesPerLine + 1;
        dataView[off1++] = SYN;
        dataView[off2++] = SYN;
        for (var y = 0; y < img.height; y += 8) {
          var cur1 = 0;
          var cur2 = 0;
          for (var bit = 0; bit < 8; bit++) {
            cur1 = cur1 << 1;
            cur2 = cur2 << 1;
            var i = ((img.height - (y+bit) - 1) * img.width + x) * 4;
            // convert color to greyscale
            var color = (0.2126 * img.data[i] + 0.7152 * img.data[i+1] + 0.0722 * img.data[i+2]);
            // we want higher numbers to be darker colors
            color = 255 - color;
            // multiple color by alpha channel
            color = color * img.data[i+3] / 255;
            // set 0 1 or both bits depending on color
            if (color > 170) {
              cur1 |= 1; cur2 |= 1;
            } else if (color > 85) {
              // for grey, alternate which of the two bits we set
              if (bit & 1) cur1 |= 1; else cur2 |= 1;
            }
          }
          dataView[off1++] = cur1;
          dataView[off2++] = cur2;
        }
        offset = off2;
      }

      // Set end data
      dataView.set(endDoc, offset);

      var info = {
        "direction": "out",
        "endpoint": 2, // 2 is the Bulk OUT Endpoint. You may use chrome.usb.listInterfaces to figure which address to use for Outputing data.
        "data": data
      };
      chrome.usb.claimInterface(device, 0, function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        chrome.usb.bulkTransfer(device, info, function(transferResult) {
          console.log("Send data", transferResult);
          chrome.usb.releaseInterface(device, 0, function() {
            if (chrome.runtime.lastError)
              console.error(chrome.runtime.lastError);
          });
        });
      });
    } else {
      console.log("Device not found");
    }
  }

  // var onUsbEvent = function(event) {
  //   console.log("USB event! " + event.resultCode + " " + event.data + " " + event.data.byteLength);
  //   var dataView = new Uint8Array(event.data, 0, 7);
  //   console.log("Data: " + dataView[0] + ", " + dataView[1] + ", " + dataView[2] + ", " + dataView[3] + ", " + dataView[4] + ", " + dataView[5] + ", " + dataView[6]);
  // }

  chrome.usb.findDevices( {"vendorId": vendorId, "productId": productId}, onDeviceFound);

}

function toGreyScale(imgData) {
  for (var y = 0; y < imgData.height; y++) {
    for (var x = 0; x < imgData.width; x++) {
      var i = (y * imgData.width + x) * 4;
      var color = (0.2126 * imgData.data[i] + 0.7152 * imgData.data[i+1] + 0.0722 * imgData.data[i+2]);
      imgData.data[i] = color;
      imgData.data[i+1] = color;
      imgData.data[i+2] = color;
      imgData.data[i+3] = 255;
    }
  }
}

function ditherImg(imgData) {
  var offsets = [1, 2, imgData.width-1, imgData.width, imgData.width+1, 2*imgData.width];
  var imgSize = 4* imgData.width * imgData.height;
  for (var y = 0; y < imgData.height; y++) {
    for (var x = 0; x < imgData.width; x++) {
      var i = (y * imgData.width + x) * 4;
      var color = imgData.data[i];
      var ocolor;
      if (color > 170) {
        ocolor = 255;
      } else if (color > 85) {
        ocolor = 128;
      } else {
        ocolor = 0;
      }
      imgData.data[i] = ocolor;
      imgData.data[i+1] = ocolor;
      imgData.data[i+2] = ocolor;
      var diff = ocolor - color;
      // if diff > 0, ocolor is higher than color, so subtract it from neighbours
      var delta = Math.round(diff / 8);
      for (o in offsets) {
        var j = i + 4*o;
        // should make sure this didn't wrap around
        if (j < imgSize) {
          var c = imgData.data[j] - delta;
          if (c < 0) c = 0;
          if (c > 255) c = 255;
          imgData.data[j] = c;
        }
      }
    }
  }
}

  var dither = function() {
    var ictx = $("previewCanvas").getContext('2d');
    var octx = $("ditheredCanvas").getContext('2d');
    var img = ictx.getImageData(0, 0, pageHeight, pageWidth);
    toGreyScale(img);
    ditherImg(img);
    octx.putImageData(img, 0, 0);
  };

  var print = function() {
    updateCanvas();
    dither();
    requestPermission(printCanvas);
  }

  var preview = function() {
    updateCanvas();
    var ictx = $("previewCanvas").getContext('2d');
    var img = ictx.getImageData(0, 0, pageHeight, pageWidth);
    toGreyScale(img);
    ditherImg(img);
    ictx.putImageData(img, 0, 0);
  }

  var updateCanvas = function(e) {
    var canvas = $("previewCanvas");
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, pageHeight, pageWidth);
    ctx.fillStyle = "#000";
    var img = logoImg;
    var scale = 1;
    if (img.height > pageWidth) {
      scale = pageWidth / img.height;
    }
    var y = 0;
    if (img.height < pageWidth) {
      y = (pageWidth - img.height) / 2;
    }
    ctx.font = "64px sans-serif";
    var nameSize = ctx.measureText($("name").value);
    ctx.font = "48px sans-serif";
    var nickSize = ctx.measureText($("nick").value);
    var textX;
    if (img.width * scale > 2*(pageHeight / 5)) {
      textX = (pageHeight - nameSize.width) / 2;

      ctx.globalAlpha = 0.6;
      ctx.drawImage(img, 0, 0, img.width, img.height, (pageHeight - (scale * img.width)) / 2, y, img.width*scale, img.height*scale);
      ctx.globalAlpha = 1.0;
      ctx.font = "64px sans-serif";
      ctx.fillText($("name").value, textX, pageWidth / 2);
      ctx.font = "48px sans-serif";
      ctx.fillText($("nick").value, textX, pageWidth / 2 + 64);
    } else {
      textX = img.width * scale + 16;
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, y, img.width*scale, img.height*scale);
      ctx.font = "64px sans-serif";
      ctx.fillText($("name").value, textX, pageWidth / 2);
      ctx.font = "48px sans-serif";
      ctx.fillText($("nick").value, textX, pageWidth / 2 + 64);
    }
      $("name").style.left = (Math.round(textX)+24)+'px';
      $("nick").style.left = (Math.round(textX)+24)+'px';
      $$(".photooverlay").style.width = (img.width*scale)+'px';
  };

  logoImg.onload = updateCanvas;

  var selectImage = function(e) {
    chrome.fileSystem.chooseEntry({'acceptsAllTypes': false,
                                  'accepts': [{'mimeTypes': ['image/*']}],
                                  'type': 'openFile'}, function(fileEntry) {
      if (!fileEntry || !fileEntry.file) return;
      fileEntry.file(function(file) {
        console.log("Success: " + file);
        var reader = new FileReader();
        reader.onload = function(e) {
          logoImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }, function(error) {
        console.log("Error: " + error.code);
      });
    });
  };

  var stream;
  var width = 280, height = 0;
  var tempCanvas = $('tempCanvas');
  var video = $('video');
  var startTakePicture = function(e) {
    navigator.webkitGetUserMedia({audio: false, video: true}, function(videoStream) {
      stream = videoStream;
      video.src = webkitURL.createObjectURL(stream);
      video.style.display = 'block';
      video.play();
    }, function(e) {
      console.error(e);
    });
  };

  $('camera').addEventListener('click', startTakePicture);

  video.addEventListener('loadedmetadata', function(ev){
    height = video.videoHeight / (video.videoWidth/width);
    video.setAttribute('width', width);
    video.setAttribute('height', height);
    tempCanvas.setAttribute('width', width);
    tempCanvas.setAttribute('height', height);
  }, false);


  var takePicture = function() {
    stream.stop();
    video.style.display = 'none';
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d').drawImage(video, 0, 0, width, height);
    var data = tempCanvas.toDataURL('image/png');
    logoImg.src=data;
  };

  video.addEventListener('click', takePicture);



  var updateCanvasSize = function(e) {
    var curWindow = chrome.app.window.current();
    var canvas = $("previewCanvas");
    pageHeight = parseInt($('pageWidth').value, 10);
    pageWidth = parseInt($('pageHeight').value, 10);
    if (pageWidth % 8 != 0) {
      pageWidth = pageWidth + 8 - pageWidth % 8;
    }
    $('pageWidth').value=pageHeight;
    $('pageHeight').value=pageWidth;
    canvas.setAttribute('width', pageHeight);
    canvas.setAttribute('height', pageWidth);
    updateCanvas();

    curWindow.outerBounds.width = Math.max(1030, pageHeight + 130);
    curWindow.outerBounds.height = pageWidth + 400;
  };


window.addEventListener('DOMContentLoaded', function() {
  $('name').addEventListener('change', updateCanvas);
  $('nick').addEventListener('change', updateCanvas);
  $('print').addEventListener('click', print);
  $('previewBtn').addEventListener('click', preview);
  $('setImage').addEventListener('click', selectImage);
  $('pageHeight').addEventListener('change', updateCanvasSize);
  $('pageWidth').addEventListener('change', updateCanvasSize);
  updateCanvas();
});
