
// 3D code partially grabbed from http://dev.opera.com/articles/view/porting-3d-graphics-to-the-web-webgl-intro-part-2/

// Cribbed from three.js's class of the same name and updated to use pointer
// lock.
OrbitControls = function(object, domElement) {
  THREE.EventTarget.call(this);
  this.object = object;
  this.domElement = domElement;

  // API
  this.center = new THREE.Vector3();

  this.userZoom = true;
  this.userZoomSpeed = 1.0;

  this.userRotate = true;
  this.userRotateSpeed = 1.0;

  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // internals

  var scope = this;

  var EPS = 0.000001;
  var PIXELS_PER_ROUND = 1800;

  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();

  var zoomStart = new THREE.Vector2();
  var zoomEnd = new THREE.Vector2();
  var zoomDelta = new THREE.Vector2();

  var phiDelta = 0;
  var thetaDelta = 0;
  var scale = 1;

  var lastPosition = new THREE.Vector3();

  var STATE = { NONE : -1, ROTATE : 0, ZOOM : 1 };
  var state = STATE.NONE;

  // events

  var changeEvent = { type: 'change' };

  this.rotateLeft = function(angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    thetaDelta -= angle;
  };

  this.rotateRight = function(angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    thetaDelta += angle;
  };

  this.rotateUp = function(angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    phiDelta -= angle;
  };

  this.rotateDown = function(angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    phiDelta += angle;
  };

  this.zoomIn = function(zoomScale) {
    if (zoomScale === undefined) {
      zoomScale = getZoomScale();
    }

    scale /= zoomScale;
  };

  this.zoomOut = function(zoomScale) {
    if (zoomScale === undefined) {
      zoomScale = getZoomScale();
    }

    scale *= zoomScale;
  };

  this.update = function() {
    var position = this.object.position;
    var offset = position.clone().subSelf(this.center)

    // angle from z-axis around y-axis

    var theta = Math.atan2(offset.x, offset.z);

    // angle from y-axis

    var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

    if (this.autoRotate) {
      this.rotateLeft(getAutoRotationAngle());
    }

    theta += thetaDelta;
    phi += phiDelta;

    // restrict phi to be betwee EPS and PI-EPS

    phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

    var radius = offset.length();
    offset.x = radius * Math.sin(phi) * Math.sin(theta);
    offset.y = radius * Math.cos(phi);
    offset.z = radius * Math.sin(phi) * Math.cos(theta);
    offset.multiplyScalar(scale);

    position.copy(this.center).addSelf(offset);

    this.object.lookAt(this.center);

    thetaDelta = 0;
    phiDelta = 0;
    scale = 1;

    if (lastPosition.distanceTo(this.object.position) > 0) {
      this.dispatchEvent(changeEvent);
      lastPosition.copy(this.object.position);
    }
  };


  function getAutoRotationAngle() {
    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
  }

  function getZoomScale() {
    return Math.pow(0.95, scope.userZoomSpeed);
  }

  function onMouseDown(event) {
    if (!scope.userRotate) return;

    event.preventDefault();

    if (event.button === 0 || event.button === 2) {
      state = STATE.ROTATE;
      rotateStart.set(event.clientX, event.clientY);
      rotateEnd.set(event.clientX, event.clientY);
    } else if (event.button === 1) {
      state = STATE.ZOOM;
      zoomStart.set(event.clientX, event.clientY);
      zoomEnd.set(event.clientX, event.clientY);
    }

    scope.domElement.requestPointerLock =
      scope.domElement.requestPointerLock ||
      scope.domElement.mozRequestPointerLock ||
      scope.domElement.webkitRequestPointerLock;
    scope.domElement.requestPointerLock();

    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseup', onMouseUp, false);
  }

  function onMouseMove(event) {
    event.preventDefault();

    if (state === STATE.ROTATE) {
      rotateEnd.addSelf({
        x: event.movementX || event.webkitMovementX || 0,
        y: event.movementY || event.webkitMovementY || 0
      });
      rotateDelta.sub(rotateEnd, rotateStart);

      scope.rotateLeft(2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed);
      scope.rotateUp(2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed);

      rotateStart.copy(rotateEnd);
    } else if (state === STATE.ZOOM) {
      zoomEnd.addSelf({
        x: event.movementX || event.webkitMovementX || 0,
        y: event.movementY || event.webkitMovementY || 0
      });
      zoomDelta.sub(zoomEnd, zoomStart);

      if (zoomDelta.y > 0) {
        scope.zoomIn();
      } else {
        scope.zoomOut();
      }

      zoomStart.copy(zoomEnd);
    }
  }

  function onMouseUp(event) {
    if (!scope.userRotate) return;

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);

    state = STATE.NONE;

    document.exitPointerLock =
      document.exitPointerLock ||
      document.mozExitPointerLock ||
      document.webkitExitPointerLock;
    document.exitPointerLock();
  }

  function onMouseWheel(event) {
    if (!scope.userZoom) return;

    if (event.wheelDelta > 0) {
      scope.zoomOut();
    } else {
      scope.zoomIn();
    }
  }

  this.domElement.addEventListener('contextmenu', function(event) { event.preventDefault(); }, false);
  this.domElement.addEventListener('mousedown', onMouseDown, false);
  this.domElement.addEventListener('mousewheel', onMouseWheel, false);
};

document.addEventListener('DOMContentLoaded', function() {
    if (!Detector.webgl) Detector.addGetWebGLMessage();

    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var FLOOR = 0;

    var container;

    //var camera, scene, controls;
    var webglRenderer;

    var zmesh, geometry;

    var mouseX = 0, mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    init();
    animate();

    function init() {

      var closeEl=document.querySelector(".close");
      console.log(closeEl);
      if (closeEl) {
        closeEl.addEventListener('click', function() {
          window.close();
        });
        closeEl.addEventListener('mousedown', function(e) {
          e.stopPropagation();
        });
      };

      container = document.createElement('div');
      document.body.appendChild(container);

      // camera
      camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 100000);
      camera.position.z = 75;

      //scene
      scene = new THREE.Scene();

      // lights
      var ambient = new THREE.AmbientLight(0xffffff);
      scene.add(ambient);

      // more lights
      var directionalLight = new THREE.DirectionalLight(0xffeedd);
      directionalLight.position.set(0, -70, 100).normalize();
      scene.add(directionalLight);

      // renderer
      webglRenderer = new THREE.WebGLRenderer();
      webglRenderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      webglRenderer.domElement.style.position = "relative";
      container.appendChild(webglRenderer.domElement);

      // load ascii model
      var jsonLoader = new THREE.JSONLoader();
      jsonLoader.load("obj/html5rocks.js", function(geometry) { createScene(geometry) });

      controls = new OrbitControls(camera, container);
      controls.autoRotate = true;
    }

    function createScene(geometry) {
      zmesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
      zmesh.position.set(-10, -10, 0);
      zmesh.scale.set(1, 1, 1);
      scene.add(zmesh);
    }

    function onDocumentMouseDown(event) {
      if (event.button !== 0)
        return;
      document.body.requestPointerLock =
        document.body.requestPointerLock ||
        document.body.mozRequestPointerLock ||
        document.body.webkitRequestPointerLock;
      document.body.requestPointerLock();
    }

    function onDocumentMouseUp(event) {
      document.exitPointerLock =
        document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
      document.exitPointerLock();
    }

    function onDocumentMouseWheel(event) {
      camera.position.z -= event.wheelDelta/120*3;
    }

    function onDocumentMouseMove(event) {
      if (!event.which) return;
      document.pointerLockElement =
        document.pointerLockElement ||
        document.mozPointerLockElement ||
        document.webkitPointerLockElement;
      if (document.pointerLockElement) {
        mouseX += event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        mouseY += event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      render();
    }

    function render() {
      controls.update();

      webglRenderer.render(scene, camera);
    }

});

