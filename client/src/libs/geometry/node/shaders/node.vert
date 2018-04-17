uniform sampler2D positionTexture;
uniform float decayTime;
uniform float scale;
uniform float cycleColors;
uniform float camDistToCenter;

attribute float id;
attribute vec4 color;

varying vec4 vColor;
varying float vDecay;
varying float vActive;
varying float vDist;
varying float vDistSq;
varying float dofAmount;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

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
        
        float decayScale = scale * ((vDecay * 0.65) + 1.0);

        vDist = decayScale / length(mvPosition.xyz);
        vDistSq = decayScale / dot(mvPosition.xyz, mvPosition.xyz);

        dofAmount = map(camDistToCenter, 0., 2000., 1., 0.);

        gl_PointSize = vDist;
        gl_Position = projectionMatrix * mvPosition;
    }
}