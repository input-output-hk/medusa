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

  vDist = 0.05;

  dofAmount = map(camDistToCenter, 0., 4000., 0., 0.5);

  vDist += dofAmount;

  vDist = clamp(vDist, 0., 0.2);

  gl_Position = projectionMatrix * mvPosition;
}