'use strict';

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

function createBlobFromeDataURL(base64DataURL) {
  var strippedData = base64DataURL.substr(
      base64DataURL.indexOf(';base64,') + ';base64,'.length);
  strippedData = atob(strippedData);
  var rawData = new Uint8Array(strippedData.length);
  for (var i = 0; i < strippedData.length; i++) {
    rawData[i] = strippedData.charCodeAt(i);
  }
  return new Blob([rawData.buffer], {type: 'image/png'});
}

function init(saveImage) {
  loadShaders([
    'shaders/blur.x.glsl',
    'shaders/blur.y.glsl',
    'shaders/sobel.fs.glsl',
    'shaders/copy.fs.glsl',
    'shaders/merge.fs.glsl',
    'shaders/toonize.fs.glsl',
    'shaders/flake.fs.glsl'
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
    var flakeProgram = postproc.createProgram(shaders[6], {time: '1f'});

    var origin = postproc.createInput();
    var blurred1 = postproc.createInput();
    var blurred2 = postproc.createInput();
    var sobel = postproc.createInput();
    var oagTexture= postproc.createInput();
    var output = postproc.createInput();


    var WIDTH = 640;
    var HEIGHT = 480;
    var video = document.createElement('video');

    var oagImage = new Image();
    oagImage.src = "../images/oag.jpg";
    oagImage.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1024;
      var ctx = canvas.getContext('2d');
      ctx.translate(WIDTH, HEIGHT);
      ctx.scale(-1, -1);
      ctx.drawImage(oagImage, 0, 0, oagImage.width, oagImage.height, 0, 0, WIDTH, HEIGHT);
      postproc.gl.bindTexture(postproc.gl.TEXTURE_2D, oagTexture);
      postproc.gl.texImage2D(postproc.gl.TEXTURE_2D, 0, postproc.gl.RGBA, postproc.gl.RGBA, postproc.gl.UNSIGNED_BYTE, canvas);
    };

    document.querySelector('#close-button').onclick = function() {
      chrome.app.window.current().close();
    };

    function tick() {

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
      window.requestAnimationFrame(tick);
    }

    function flake() {
      postproc.callProgram(flakeProgram, [oagTexture], output, {time: performance.now()});
      postproc.renderTexture(output);
      window.requestAnimationFrame(flake);
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

          prependNewPicture(canvas.toDataURL('image/png;base64'));
        } finally {
          setTimeout(function () {
            button.disabled = false;
          }, 1000);
        }
      };
      button.disabled = false;
    }

    navigator.getUserMedia({video: true}, function (stream) {
      video.src = URL.createObjectURL(stream);
      video.play();

      // wait for enough data to read videoWidth/videoHeight properties
      video.addEventListener('loadeddata',function() {
        WIDTH = video.videoWidth;
        HEIGHT = video.videoHeight;
        dstCanvas.width = WIDTH;
        dstCanvas.height = HEIGHT;
        srcCtx.translate(WIDTH, HEIGHT);
        srcCtx.scale(-1, -1);

        window.requestAnimationFrame(tick);
      });

      bindEvents();
    }, function () {
      console.error("Cannot acquire user media.");
      document.querySelector('#no-camera').style.display = 'block';
      dstCanvas.width = WIDTH;
      dstCanvas.height = HEIGHT;
      srcCtx.translate(WIDTH, HEIGHT);
      srcCtx.scale(-1, -1);
      window.requestAnimationFrame(flake);
    });
  });
}

window.onCreatedFileSystem = function (fileSystem) {
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
        img.addEventListener('dragstart', function (event) {
          event.dataTransfer.setData("image/png", file);
        });
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
};


var saveImage = function (blob) { imagesToSave.push([Date.now(), blob]); },
    imagesToSave = [];

init(function (blob) {
  saveImage(blob);
});

