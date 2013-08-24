'use strict';

function createBlobFromeDataURL(base64DataURL) {
  var strippedData = base64DataURL.substr(
      base64DataURL.indexOf(';base64,') + ';base64,'.length);
  strippedData = atob(strippedData);
  var rawData = new Uint8Array(strippedData.length);
  for (var i = 0; i < strippedData.length; i++)
    rawData[i] = strippedData.charCodeAt(i);
  return new Blob([rawData.buffer], {type: 'image/png'});
}

function init(saveImage) {
  loadShaders([
    'shaders/blur.x.glsl',
    'shaders/blur.y.glsl',
    'shaders/sobel.fs.glsl',
    'shaders/copy.fs.glsl',
    'shaders/merge.fs.glsl',
    'shaders/toonize.fs.glsl'
  ], function (shaders) {
    var srcCanvas = document.createElement('canvas');
    srcCanvas.width = 1024;
    srcCanvas.height = 1024;
    var srcCtx = srcCanvas.getContext('2d');
    var dstCanvas = document.getElementById('main-canvas');
    var postproc = new PostProcessor(dstCanvas, 1024, 1024);

    var blurXProgram = postproc.createProgram(shaders[0]);
    var blurYProgram = postproc.createProgram(shaders[1]);
    var sobelProgram = postproc.createProgram(shaders[2]);
    var copyProgram = postproc.createProgram(shaders[3]);
    var mergeProgram = postproc.createProgram(shaders[4]);
    var toonizeProgram = postproc.createProgram(shaders[5]);

    var origin = postproc.createInput();
    var blurred1 = postproc.createInput();
    var blurred2 = postproc.createInput();
    var sobel = postproc.createInput();
    var output = postproc.createInput();

    var WIDTH = 800;
    var HEIGHT = 600;
    var video = document.createElement('video');
    var waitForPreview = 0;

    function tick() {
      if (Date.now() < waitForPreview) {
        setTimeout(tick, waitForPreview - Date.now());
        return;
      }
      // We require a power-of-2-sized image.
      // Past the video to such a canvas first.
      srcCtx.drawImage(video, 0, 0);
      postproc.setupInputImage(srcCanvas);
      postproc.copyTo(origin);

      // Sobel operator
      postproc.callProgram(sobelProgram, [origin], sobel);

      // Feature preserving smoothing.
      postproc.callProgram(blurXProgram, [sobel, origin], blurred1);
      postproc.callProgram(blurYProgram, [sobel, blurred1], blurred2);

      // Toonize image
      postproc.callProgram(toonizeProgram, [sobel, blurred2], blurred1);

      // Merge toonized image with edges.
      postproc.callProgram(mergeProgram, [sobel, blurred1], output);

      postproc.renderTexture(output);
      webkitRequestAnimationFrame(tick);
    }

    function prependNewPicture(dataUrl) {
      var blob = createBlobFromeDataURL(dataUrl);
      // Inserts to list
      var img = document.createElement('img');
      img.className = "invisible";
      img.draggable = true;
      img.src = dataUrl;
      var list = document.querySelector('#list');
      list.insertBefore(img, list.childNodes[0]);
      list.scrollLeft = 0;
      setTimeout(function () {
        img.classList.remove('invisible');
      }, 0);

      saveImage(blob);
    }

    function bindEvents() {
      var button = document.querySelector('button');
      var data = new Uint32Array(1024 * 1024);
      button.onclick = function () {
        button.disabled = true;
        try {

          var canvas = document.createElement('canvas');
          canvas.width = WIDTH;
          canvas.height = HEIGHT;
          postproc.iterate(copyProgram);
          postproc.readBackTexture(output, data);
          var ctx = canvas.getContext('2d');
          var imageData = ctx.createImageData(1024, 1024);
          imageData.data.set(new Uint8Array(data.buffer));
          ctx.putImageData(imageData, 0, 0);

          // Flip the image
          ctx.translate(0, HEIGHT);
          ctx.scale(1, -1);
          ctx.drawImage(canvas, 0, 0);

          dstCanvas.classList.add('invisible');
          setTimeout(function () {
            dstCanvas.classList.remove('invisible');
          });

          waitForPreview = Date.now() + 1000;

          prependNewPicture(canvas.toDataURL('image/png;base64'));
        } finally {
          setTimeout(function () {
            button.disabled = false;
          }, 1000);
        }
      };
      button.disabled = false;
    }

    navigator.webkitGetUserMedia({video: true}, function (stream) {
      video.src = URL.createObjectURL(stream);
      video.play();
      setTimeout(function () {
        WIDTH = video.videoWidth;
        HEIGHT = video.videoHeight;
        dstCanvas.width = WIDTH;
        dstCanvas.height = HEIGHT;
        srcCtx.translate(WIDTH, HEIGHT);
        srcCtx.scale(-1, -1);

        webkitRequestAnimationFrame(tick);
      }, 100);

      bindEvents();
    });
  });
}

var saveImage = function (blob) {
      imagesToSave.push([Date.now(), blob]);
    },
    imagesToSave = [];

chrome.syncFileSystem.requestFileSystem(function (fileSystem) {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }

  var reader = fileSystem.root.createReader();
  var entries = [];

  function insertImage(fileEntry) {
    fileEntry.file(function (file) {
      var reader = new FileReader();
      reader.onloadend = function (e) {
        var img = document.createElement('img');
        img.className = "invisible";
        img.draggable = true;
        img.src = this.result;
        var list = document.querySelector('#list');
        list.appendChild(img);
        list.scrollLeft = 0;
        setTimeout(function () {
          img.classList.remove('invisible');
        }, 0);
      };
      reader.readAsDataURL(file);
    });
  }

  function readEntries() {
    reader.readEntries(function (results) {
      if (results.length) {
        entries.push.apply(entries, results);
        readEntries();
      } else {
        entries.sort(function (a, b) {
          return parseFloat(b.name.substr('image-'.length)) - parseFloat(a.name.substr('image-'.length));
        });
        for (var i = 0; i < entries.length; i++) {
          insertImage(entries[i]);
        }
        saveImage = function (blob) {
          // Writes to file system
          var time = Date.now();
          fileSystem.root.getFile('image-' + time + '.png', {create: true, exclusive: true}, function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
              fileWriter.write(blob);
            });
          });
        };
        for (i = 0; i < imagesToSave.length; i++) {
          (function (time, blob) {
            fileSystem.root.getFile('image-' + time + '.png', {create: true, exclusive: true}, function (fileEntry) {
              fileEntry.createWriter(function (fileWriter) {
                fileWriter.write(blob);
              });
            });
          }(imagesToSave[i][0], imagesToSave[i][1]));
        }
      }
    });
  }

  readEntries();
});

init(function (blob) {
  saveImage(blob);
});
