#line 10001
#ifdef GL_ES
precision highp float;
#endif

float b2f(vec4 fbytes) {
    ivec4 bytes = ivec4(fbytes * 255.0 + 0.5);
    float f = float(bytes[0] + bytes[1] * 256) +
        float(bytes[2] - bytes[2] / 128 * 128 + 128) * 256.0 * 256.0;
    int exp = 150 - (bytes[3] - bytes[3] / 128 * 128) * 2 - (bytes[2] / 128);
    f /= exp2(float(exp));
    return float(1 - (bytes[3] / 128) * 2) * f;
}

vec4 f2b(float f) {
    if (f == 0.0)
        return vec4(0);
    bool pos = f > 0.0;
    if (!pos)
        f = -f;
    int expo = int(floor(log2(f)));
    f *= pow(2.0, 23.0 - float(expo));
    f -= 8388608.0;
    int b = int(floor(f + 0.5));
    expo += 127;
    int posbit = pos ? 0 : 128;
    return vec4(b - b / 256 * 256, b / 256 - b / 256 / 256 * 256,
                b / 256 / 256 + (expo - expo / 2 * 2) * 128,
                expo / 2 + posbit) / 255.0;
}
