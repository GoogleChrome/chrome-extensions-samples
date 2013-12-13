#include "packing.include.glsl"
#include "index.include.glsl"
#line 3

uniform sampler2D texture0;

void main() {
  vec4 gx = (getd(texture0, -1, -1) - getd(texture0, 1, -1)) +
      (getd(texture0, -1, 0) - getd(texture0, 1, 0)) * 2.0 +
      (getd(texture0, -1, 1) - getd(texture0, 1, 1));
  vec4 gy = (getd(texture0, -1, -1) - getd(texture0, -1, 1)) +
      (getd(texture0, 0, -1) - getd(texture0, 0, 1)) * 2.0 +
      (getd(texture0, 1, -1) - getd(texture0, 1, 1));
  gl_FragColor = 1.0 - sqrt(gx * gx + gy * gy);
}
