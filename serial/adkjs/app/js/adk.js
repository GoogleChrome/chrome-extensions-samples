/**
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Renato Mangini (mangini@chromium.org)
Author: Luis Leao (luisleao@gmail.com)
**/

const SENSOR_REFRESH_INTERVAL=200;

(function() {
  
  var btnOpen=document.querySelector(".open");
  var btnClose=document.querySelector(".close");
  var logArea=document.querySelector(".log");
  var statusLine=document.querySelector("#status");
  
  var serial_devices=document.querySelector(".serial_devices");
  
  var logObj=function(obj) {
    console.log(obj);
  }
  var logSuccess=function(msg) {
    log("<span style='color: green;'>"+msg+"</span>");
  };
  var logError=function(msg) {
    statusLine.className="error";
    statusLine.textContent=msg;
    log("<span style='color: red;'>"+msg+"</span>");
  };
  var log=function(msg) {
    console.log(msg);
    logArea.innerHTML=msg+"<br/>"+logArea.innerHTML;
  };
  
  
  var changeTab=function() {
    var _in=document.querySelector("#in"),
        _out=document.querySelector("#out");
    if (window.location.hash==="#outlink") {
      _out.className="";
      _in.className="hidden";
    } else {
      _in.className="";
      _out.className="hidden";
    }
  } 
  
  var init=function() {
    if (!serial_lib) throw "You must include serial.js before";

    flipState(true);
    btnOpen.addEventListener("click", openSerial);
    btnClose.addEventListener("click", closeSerial);
    window.addEventListener("hashchange", changeTab);
    document.querySelector(".refresh").addEventListener("click", refreshPorts);
    initADKListeners();
    refreshPorts();
  };

  var initADKListeners=function() {

    addEventToElements("change", ".servos input[type='range']", function(e, c) {
        writeSerial("s"+c+convertToChars(parseInt(this.value)));
    });
    addEventToElements("change", ".leds input[type='range']", function(e, c) {
        this.nextSibling.textContent=this.value;
        writeSerial("c"+c+convertToChars(parseInt(this.value)));
    });
    addEventToElements("click", ".relays button", function(e, c) {
      var on=this.className.indexOf(" on");
      if (on>=0) {
        // turn it off
        this.className=this.className.substring(0, on);
        this.textContent="Off";
        writeSerial("t"+c+"0");
      } else {
        // turn it on
        this.className=this.className+" on";
        this.textContent="On";
        writeSerial("t"+c+"1");
      }
    });

    setInterval(function() { writeSerial("data"); }, SENSOR_REFRESH_INTERVAL);
  };
  
  var addEventToElements=function(eventType, selector, listener) {
    var elems=document.querySelectorAll(selector);
    
    for (var i=0; i<elems.length; i++) {
      (function() {
        var c=i;
        elems[i].addEventListener(eventType, function(e) {
          listener.apply(this, [e, c]);
        });
      })();
    }
  };

  var convertToChars=function(i) {
    var ch=i.toString(16);
    if (ch.length==1) return "0"+ch;
    return ""+ch;
  };
  
  var flipState=function(deviceLocated) {
    btnOpen.disabled=!deviceLocated;
    btnClose.disabled=deviceLocated;
  };
  
  var refreshPorts=function() {
    while (serial_devices.options.length > 0)
      serial_devices.options.remove(0);
    
    serial_lib.getPorts(function(items) {
      logSuccess("got "+items.length+" ports");
      for (var i=0; i<items.length; i++) {
         serial_devices.options.add(new Option(items[i], items[i]));
         if (i==1 || /usb/i.test(items[i]) && /tty/i.test(items[i])) {
           serial_devices.selectionIndex=i;
           logSuccess("auto-selected "+items[i]);
         }
      }
    });
  };
  
  var openSerial=function() {
    var serialPort=serial_devices.options[serial_devices.options.selectedIndex].value;
    if (!serialPort) {
      logError("Invalid serialPort");
      return;
    }
    statusLine.className="on";
    statusLine.textContent="Connecting";
    flipState(true);
    serial_lib.openSerial(serialPort, onOpen);
  };
  
  var onOpen=function(cInfo) {
    logSuccess("Device found (connectionId="+cInfo.connectionId+")");
    flipState(false);
    statusLine.textContent="Connected";
    serial_lib.startListening(onRead);
  };
  
  var writeSerial=function(writeString) {
    if (!serial_lib.isConnected()) {
      return;
    }
    if (!writeString) {
      logError("Nothing to write");
      return;
    }
    if (writeString.charAt(writeString.length-1)!=='\n') {
      writeString+="\n"; 
    }
    serial_lib.writeSerial(writeString); 
  }
  
  var onRead=function(readData) {
    if (readData.indexOf("log:")>=0) {
      return;
    }
    var m=/([^:]+):([-]?\d+)(?:,([-]?\d+))?/.exec(readData);
    if (m && m.length>0) {
      switch (m[1]) {
        case "b1": document.querySelector("#b1").className=m[2]==="0"?"":"on"; break;
        case "b2": document.querySelector("#b2").className=m[2]==="0"?"":"on"; break;
        case "b3": document.querySelector("#b3").className=m[2]==="0"?"":"on"; break;
        case "c": document.querySelector("#bc").className=m[2]==="0"?"":"on"; log(readData); break;
        
        case "js": document.querySelector("#joy .pointer").className=m[2]==="0"?"pointer":"pointer on"; break;
        case "t": document.querySelector("#temp").textContent=convertTemperature(m[2]); break;
        case "l": 
          document.querySelector("#light").textContent=Math.round((1000*parseInt(m[2])/1024))/10;
          document.querySelector("#lightv1").textContent=m[2];
          break;
        case "jxy":
          var el=document.querySelector("#joy .pointer");
          el.style.left=((128+parseInt(m[2])*0.6)/256.0*el.parentElement.offsetWidth)+"px";
          el.style.top=((128+parseInt(m[3])*0.9)/256.0*el.parentElement.offsetHeight)+"px";
          el.textContent=m[2]+","+m[3];
          break;
      }
    }
  }
  
  var convertTemperature=function(temperatureFromArduino) {

    // from ADK Android code:
    /*
     * Arduino board contains a 6 channel (8 channels on the Mini and Nano,
     * 16 on the Mega), 10-bit analog to digital converter. This means that
     * it will map input voltages between 0 and 5 volts into integer values
     * between 0 and 1023. This yields a resolution between readings of: 5
     * volts / 1024 units or, .0049 volts (4.9 mV) per unit.
    */
    var voltagemv = temperatureFromArduino * 4.9;
    /*
     * The change in voltage is scaled to a temperature coefficient of 10.0
     * mV/degC (typical) for the MCP9700/9700A and 19.5 mV/degC (typical)
     * for the MCP9701/9701A. The out- put voltage at 0 degC is also scaled
     * to 500 mV (typical) and 400 mV (typical) for the MCP9700/9700A and
     * MCP9701/9701A, respectively. VOUT = TC¥TA+V0degC
     */
    var kVoltageAtZeroCmv = 400,
        kTemperatureCoefficientmvperC = 19.5;
    var ambientTemperatureC = (voltagemv - kVoltageAtZeroCmv) / kTemperatureCoefficientmvperC;
    var temperatureF = (9.0 / 5.0) * ambientTemperatureC + 32.0;
    return Math.round(temperatureF);
  };

  var closeSerial=function() {
   serial_lib.closeSerial(onClose);
  };
  
  var onClose = function(result) {
   flipState(true);
   statusLine.textContent="Hover here to connect";
   statusLine.className="";
  }
  
  
  init();
})();

