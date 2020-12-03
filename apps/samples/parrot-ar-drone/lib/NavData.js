var DRONE = DRONE || {};
DRONE.NavData = (function() {
  function parse(data) {
  // See ARDroneLib/Soft/Common/navdata_common.h
    var start = 16, checksum_block = 8;
    var view = new DataView(data),
        dataLen = data.byteLength;

    if(start + checksum_block >= dataLen) {
      return;
    }

    var header = view.getInt32(0, true);
    var droneState = view.getInt32(4, true);
    var sequence = view.getInt32(8, true);
    var visonFlag = view.getInt32(12, true);
    var options = null;

    var optionId = view.getInt16(start, true);
    if (optionId == 0) {
      options = {
          optionId: optionId,
          optionSize: view.getInt16(start + 2, true),
          controlState: view.getUint32(start + 4, true),
          batteryPercentage: view.getUint32(start + 8, true),
          theta: view.getFloat32(start + 12, true),
          phi: view.getFloat32(start + 16, true),
          psi: view.getFloat32(start + 20, true),
          altitude: view.getInt32(start + 24, true),
          vx: view.getFloat32(start + 28, true),
          vy: view.getFloat32(start + 32, true),
          vz: view.getFloat32(start + 36, true)
        };
    }

    // TODO: parse droneState and controlState
    document.getElementById('droneState').innerHTML = droneState;
    document.getElementById('visonFlag').innerHTML = visonFlag;
    document.getElementById('controlState').innerHTML = options.controlState;
    document.getElementById('batteryPercentage').innerHTML = options.batteryPercentage;
    document.getElementById('theta').innerHTML = options.theta;
    document.getElementById('phi').innerHTML = options.phi;
    document.getElementById('psi').innerHTML = options.psi;
    document.getElementById('altitude').innerHTML = options.altitude;
    document.getElementById('vx').innerHTML = options.vx;
    document.getElementById('vy').innerHTML = options.vy;
    document.getElementById('vz').innerHTML = options.vz;
  }

  return {
    parse: parse
  };

})();
