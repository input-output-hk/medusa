uniform sampler2D positionTexture;
uniform float cycleColors;
uniform float camDistToCenter;

attribute float updated;
attribute vec2 texLocation;

varying float vDist;
varying float vUpdated;
varying float dofAmount;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
  vec4 currentPosition = vec4(texture2D(positionTexture, texLocation.xy));

  // node index stored in w component (2.0 is root)
  if (currentPosition.w == 2.0) {
    currentPosition.xyz = vec3(0.);
  }

  vUpdated = updated;

  currentPosition.w = 1.0;

  vec4 mvPosition = modelViewMatrix * currentPosition;

  vDist = 2000.0 / dot(mvPosition.xyz, mvPosition.xyz);

  dofAmount = map(camDistToCenter, 0., 800., 0., 0.5);

  vDist = clamp(mix(vDist, .2, dofAmount), 0., .9);

  gl_Position = projectionMatrix * mvPosition;
}