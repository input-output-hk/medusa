uniform sampler2D positionTexture;
uniform float camDistToCenter;
uniform float uTime;

attribute float updated;
attribute vec2 texLocation;

varying float vAlpha;
varying float vUpdated;

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

  vAlpha = 2000.0 / dot(mvPosition.xyz, mvPosition.xyz);

  float dofAmount = clamp(map(camDistToCenter, 0., 800., 0., 1.), 0., 1.);

  float scaledTime = uTime * 0.0025;
  if (scaledTime < 1.) {
    vAlpha -= (1.0 - scaledTime);
    dofAmount -= (1.0 - scaledTime);
  }

  vAlpha = mix(vAlpha, .15, dofAmount);
  
  gl_Position = projectionMatrix * mvPosition;
}