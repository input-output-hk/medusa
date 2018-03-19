uniform sampler2D positionTexture;
uniform float decayTime;

attribute vec4 color;
varying vec4 vColor;
varying float vDecay;

const float scale = 4000.0;

void main() {
    vColor = color;
    vec3 currentPosition = texture2D(positionTexture, position.xy).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(currentPosition , 1.);

    vDecay = vColor.a - (decayTime * 0.07);
    vDecay = max(0.0, vDecay);

    float decayScale = scale;
    decayScale += vDecay * 2000.0;

    gl_PointSize = decayScale / length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
}