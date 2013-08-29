'use strict';

var MAPPING_VERTEX_SHADER = "attribute vec3 aPosition;\n" +
    "varying vec2 vTexCoord;\n" +
    "void main() {\n" +
    "  gl_Position = vec4((aPosition - 0.5) * 2.0, 1.0);\n" +
    "  vTexCoord = aPosition.xy;\n" +
    "}";
var MAPPING_FRAGMENT_SHADER = "#ifdef GL_ES\n" +
    "precision highp float;\n" +
    "#endif\n" +
    "uniform sampler2D tex0;\n" +
    "varying vec2 vTexCoord;\n" +
    "void main() {\n" +
    "  gl_FragColor = texture2D(tex0, vTexCoord);\n" +
    "}";

function PostProcessor(canvas, width, height) {
  this.width = width;
  this.height = height;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  }
  this.canvas = canvas;
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  this.gl = gl;

  this.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]), gl.STATIC_DRAW);
  this.ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 2, 1, 3]), gl.STATIC_DRAW);
  this.working_textures = [this.createTexture(), this.createTexture(), this.createTexture()];
  this.frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
  this.copyProgram = this.createProgram(MAPPING_FRAGMENT_SHADER);
}

PostProcessor.prototype.installUniform = function (program, uniformName, uniformType) {
  var gl = this.gl;
  var uniformLocation = gl.getUniformLocation(program, uniformName);
  if (uniformLocation) {
    program.uniforms.__defineGetter__(uniformName, function () {
      return gl["uniform" + uniformType](uniformLocation);
    });
    program.uniforms.__defineSetter__(uniformName, function (value) {
      gl["uniform" + uniformType](uniformLocation, value);
    });
  }
};

PostProcessor.prototype.createProgram = function (calculation, uniforms) {
  var gl = this.gl;
  try {
    var success = false;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, MAPPING_VERTEX_SHADER);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      throw "Failed to create vertex shader:\n" + gl.getShaderInfoLog(vertexShader);
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, calculation);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      throw "Failed to create fragment shader:\n" + gl.getShaderInfoLog(fragmentShader);
    }

    var program = gl.createProgram();
    // attach our two shaders to the program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw "Failed to link program";
    }

    gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPosition"));
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0); // position

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
    program.uniforms = {};
    this.installUniform(program, 'width', '1i');
    this.installUniform(program, 'height', '1i');
    program.uniforms.width = this.width;
    program.uniforms.height = this.height;
    if (uniforms) {
      for (var name in uniforms) {
        this.installUniform(program, name, uniforms[name]);
      }
    }
    success = true;
    return program;
  } finally {
    if (!success) {
      if (program) {
        gl.deleteProgram(program);
        program = undefined;
      }
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
    }
  }
};

PostProcessor.prototype.createTexture = function () {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
};

PostProcessor.prototype.setupInputImage = function (image, width, height) {
  var gl = this.gl;
  gl.viewport(0, 0, this.width, this.height);
  gl.bindTexture(gl.TEXTURE_2D, this.working_textures[0]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      this.width, this.height, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, this.working_textures[1]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
      gl.UNSIGNED_BYTE, image);
};

PostProcessor.prototype.setupInput = function (array) {
  var gl = this.gl;
  gl.viewport(0, 0, this.width, this.height);
  gl.bindTexture(gl.TEXTURE_2D, this.working_textures[0]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      this.width, this.height, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, this.working_textures[1]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      this.width, this.height, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, new Uint8Array(array.buffer));
};

PostProcessor.prototype.createInputImage = function (image, width, height) {
  var gl = this.gl;
  var texture = this.createTexture();
  gl.viewport(0, 0, this.width, this.height);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
      gl.UNSIGNED_BYTE, image);
  return texture;
};

/**
 *
 * @param [array]
 * @returns {*}
 */
PostProcessor.prototype.createInput = function (array) {
  var gl = this.gl;
  var texture = this.createTexture();
  gl.viewport(0, 0, this.width, this.height);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      this.width, this.height, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, array ? new Uint8Array(array.buffer) : null);
  return texture;
};

PostProcessor.prototype.callProgram = function (program, inputs, output, uniforms) {
  var gl = this.gl;
  gl.useProgram(program);

  // Output
  gl.viewport(0, 0, this.width, this.height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);

  // Input
  for (var i = 0; i < inputs.length; i++) {
    gl.uniform1i(gl.getUniformLocation(program, "texture" + i), i);
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, inputs[i]);
  }

  if (uniforms) {
    for (var name in uniforms) {
      program.uniforms[name] = uniforms[name];
    }
  }
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

};

PostProcessor.prototype.copyTo = function (output) {
  this.callProgram(this.copyProgram, [this.working_textures[1]], output, {});
};

PostProcessor.prototype.swap = function () {
  var temp = this.working_textures[1];
  this.working_textures[1] = this.working_textures[0];
  this.working_textures[0] = temp;
};

PostProcessor.prototype.iterate = function (program, uniforms) {
  this.callProgram(program, [this.working_textures[1]], this.working_textures[0], uniforms);
  this.swap();
};

PostProcessor.prototype.renderTexture = function (texture, width, height) {
  var gl = this.gl;
  // Output
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // Input
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.useProgram(this.copyProgram);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
};

PostProcessor.prototype.render = function (width, height) {
  this.renderTexture(this.working_textures[1], width, height);
};

PostProcessor.prototype.readBackTexture = function (texture, array) {
  this.callProgram(this.copyProgram, [texture], this.working_textures[0]);
  this.readBack(array);
};

PostProcessor.prototype.readBack = function (array) {
  var gl = this.gl;
  var buffer = new Uint8Array(array.buffer);
  gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
};
