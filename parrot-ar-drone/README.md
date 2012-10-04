# Parrot AR.Drone 2.0 Controller

This app uses the [Gamepad API](http://www.html5rocks.com/en/tutorials/doodles/gamepad/) and the [chrome.socket API](http://developer.chrome.com/apps/socket.html) to communicate with
a [Parrot AR.Drone 2.0](http://ardrone2.parrot.com/).

The SDK specifies that there are 4 socket connections:

* UDP 5554: Receiving navdata, i.e. battery, velocities, control state
* TCP 5555: Receiving H264 video [not implemented]
* UDP 5556: Sending AT commands for tilt, rotation and elevation
* UDP 5559: Sending Admin commands

The app connects to port 5556 and sends commands to the Drone depending on which
buttons are pressed on the gamepad. The commands themselves are AT commands, which
are essentially strings in a specific format. The command strings are concatenated
and converted to an ArrayBuffer and sent over the socket connection. Since the
protocol in use is UDP there is no guarantee of packet delivery so all commands
are sent approximately every 30ms.

When data comes back in it is parsed according to the navdata specification in
the Drone SDK documentation. The navdata comes back in as an ArrayBuffer from which
numbers are read from fixed byte positions. This includes data on the control
state of the drone (flying, hovering, landing, taking off), the battery percentage,
its angles, altitudes and velcocities.

_Please note: this has only been tested with an Xbox 360 controller_

## Resources

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
* [Socket](http://developer.chrome.com/apps/socket.html)

_Thanks to felixge for the [Node AR Drone lib](https://github.com/felixge/node-ar-drone), which served as a helpful reference._
