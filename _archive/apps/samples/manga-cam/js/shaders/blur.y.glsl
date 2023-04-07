#include "packing.include.glsl"
#include "index.include.glsl"
#line 3

uniform sampler2D texture0, texture1;

void main() {
  vec4 color = getd(texture1, 0, 0);
  float count = 1.0;
  float a = 1.0;
  float sobel = 0.0;
  for (int i = 1; i < 5; i++) {
    sobel = smoothstep(0.5, 0.9, 1.0 - length(getd(texture0, 0, i)) / 4.0);
    a *= exp(-sobel * 25.0);
    count += a;
    color += getd(texture1, 0, i) * a;
  }

  a = 1.0;
  for (int i = 1; i < 5; i++) {
    sobel = smoothstep(0.5, 0.9, 1.0 - length(getd(texture0, 0, -i)) / 4.0);
    a *= exp(-sobel * 25.0);
    count += a;
    color += getd(texture1, 0, -i) * a;
  }

  gl_FragColor = vec4(color.xyz / count, 1);
}
