var DRONE = DRONE || {};
DRONE.Util = (function() {

  function stringToArrayBuffer(string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for(var i = 0; i < string.length; i++) {
      view[i] = string.charCodeAt(i);
    }
    return buffer;
  }

  function float32ToInt32(floatVal) {
    var buffer = new ArrayBuffer(4);
    var view = new DataView(buffer);
    view.setFloat32(0, floatVal, true);
    return view.getInt32(0, true);
  }

  function uint8ToArrayBuffer(intVal) {
    var view = new Uint8Array([intVal]);
    return view.buffer;
  }

  function uint8ArrayToString(uArrayVal) {
    var str = '';
    for(var s = 0; s < uArrayVal.length; s++) {
      str += String.fromCharCode(uArrayVal[s]);
    }
    return str;
  }

  function uint8ArrayToHex(uArrayVal) {
    var str = '';
    for(var s = 0; s < uArrayVal.length; s++) {
      str += uArrayVal[s].toString(16) + ' ';
    }
    return str;
  }

  return {
    stringToArrayBuffer: stringToArrayBuffer,
    float32ToInt32: float32ToInt32,
    uint8ToArrayBuffer: uint8ToArrayBuffer,
    uint8ArrayToString: uint8ArrayToString,
    uint8ArrayToHex: uint8ArrayToHex
  };

})();
