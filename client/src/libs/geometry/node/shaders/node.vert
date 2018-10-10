uniform sampler2D positionTexture;
uniform float uTime;
uniform float decayTime;
uniform float scale;
uniform float cycleColors;
uniform float camDistToCenter;
uniform float nodeIsHovered;
uniform float nodeIsSelected;

attribute vec3 pickerColor;
attribute float isHovered; // id of hovered node
attribute float isSelected; // id of selected node
attribute float id;
attribute vec4 color;

varying vec4 vColor;
varying vec3 vPickerColor;
varying float vDecay;
varying float vDist;
varying float vDistSq;
varying float vSpriteMix;
varying float vIsHovered;
varying float vIsSelected;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
    vColor = color;

    vPickerColor = pickerColor; // color for GPU picker

    vIsHovered = isHovered;
    vIsSelected = isSelected;

    vec3 currentPosition = texture2D(positionTexture, position.xy).xyz;

    if (id == 0.0) {
        currentPosition = vec3(0.);
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPosition, 1.);

    if (vColor.a == 0.) {
        vDecay = 2. - (decayTime * 0.05);
        vDecay = max(0.0, vDecay);
    }

    float decayScale = scale * ((vDecay * 0.75) + 1.0);

    vDist = decayScale / length(mvPosition.xyz);
    vDistSq = decayScale / dot(mvPosition.xyz, mvPosition.xyz);

    float dofAmount = map(camDistToCenter, 0., 1000., 1., 0.);

    vSpriteMix = (1.0 - clamp(pow(vDistSq, 4.0), 0.0, 1.0)) * dofAmount;

    float scaledTime = uTime * 0.005;
    if (scaledTime < 1.) {
        vSpriteMix += (1.0 - scaledTime);
    }

    vSpriteMix = clamp(vSpriteMix, 0., 1.);

    if (nodeIsHovered == 1.0) {
        vSpriteMix = clamp( (1.0 - isHovered) * (dofAmount * 2.0), 0.0, 1.0);
    }

    vSpriteMix *= (1.0 - isSelected);

    gl_PointSize = vDist;
    gl_Position = projectionMatrix * mvPosition;

}