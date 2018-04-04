uniform sampler2D positionTexture;
uniform float decayTime;
uniform float scale;

attribute float id;
attribute vec4 color;

varying vec4 vColor;
varying float vDecay;
varying float vActive;
varying float vDist;

void main() {
    vColor = color;

    // if color is black, node is inactive
    if (vColor.r == 0.) {

        vActive = 0.;

        gl_PointSize = 0.;
        gl_Position = vec4(0.);

    } else {

        vActive = 1.;

        vec3 currentPosition = texture2D(positionTexture, position.xy).xyz;

        if (id == 0.0) {
            currentPosition = vec3(0.);
        }

        vec4 mvPosition = modelViewMatrix * vec4(currentPosition, 1.);

        if (vColor.a == 0.) {
            vDecay = 1. - (decayTime * 0.05);
            vDecay = max(0.0, vDecay);
        }
        
        float decayScale = scale;
        decayScale -= (vDecay * 10000.0);

        vDist = decayScale / length(mvPosition.xyz);

        gl_PointSize = vDist;
        gl_Position = projectionMatrix * mvPosition;
    }
}