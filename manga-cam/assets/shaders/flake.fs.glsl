#include "packing.include.glsl"
#include "index.include.glsl"
#line 3

uniform float time;
uniform sampler2D texture0;

float random(float x) {
  return fract(sin(x + fract(time/1000.0)) * 523621.2342) + 0.5;
}

void main() {
  float r = random(vTexCoord.x + vTexCoord.y * float(width));
  float oag = dot(vec3(0.33333), texture2D(texture0, vTexCoord).xyz);
  r *= (oag + 2.0) / (3.0);
  gl_FragColor = vec4(r, r, r, 1);
}
