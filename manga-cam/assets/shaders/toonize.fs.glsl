#include "packing.include.glsl"
#include "index.include.glsl"
#line 3

uniform sampler2D texture0, texture1;

void main() {
  vec3 color0 = getd(texture1, 0, 0).xyz;
  float y = dot(color0, vec3(0.299, 0.587, 0.114));
  y = (step(0.1, y) + step(0.2, y) + step(0.7, y) + step(0.9, y)) / 6.0;
  vec2 blockxy = vec2(getIndex()) / 4.0;
  vec2 blockxy1 = mat2(1, -1.732, 1.732, 1) * blockxy * 0.5;
  float z1 = (sin(blockxy1.x * 6.28318530718) *
      sin(blockxy1.y * 6.28318530718) + 1.0) / 2.0;
  gl_FragColor = vec4(vec3(smoothstep(0.45, 0.55, z1 + y)), 1);
}
