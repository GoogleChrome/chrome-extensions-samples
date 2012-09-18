var DRONE = DRONE || {};
DRONE.Sequence = (function() {

  var sequence = 0;

  function next() {
    sequence++;
    return sequence;
  }

  function reset() {
    sequence = 0;
  }

  return {
    next: next,
    reset: reset
  };
})();
