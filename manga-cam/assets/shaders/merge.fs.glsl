#include "packing.include.glsl"
#include "index.include.glsl"
#line 3

uniform sampler2D texture0, texture1;
const float V = 0.3;

void main() {
  vec4 sobelpx = getd(texture0, 0, 0);
  vec3 color0 = getd(texture1, 0, 0).xyz;
  float y = clamp(dot(color0, vec3(1.0 / 3.0)) + 0.3, 0.0, 1.0);
  float sobel = smoothstep(0.8, 0.9, clamp(length(sobelpx) - 1.0, 0.0, 1.0));
  gl_FragColor = vec4(color0 * sobel, 1);
}
