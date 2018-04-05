uniform sampler2D positionTexture;
uniform float cycleColors;

attribute float updated;
attribute vec2 texLocation;

varying float vDist;
varying float vUpdated;

void main() {
  vec4 currentPosition = vec4(texture2D(positionTexture, texLocation.xy));

  // node index stored in w component (2.0 is root)
  if (currentPosition.w == 2.0) {
    currentPosition.xyz = vec3(0.);
  }

  vUpdated = updated;

  currentPosition.w = 1.0;

  vec4 mvPosition = modelViewMatrix * currentPosition;

  vDist = 700000.0 / dot(mvPosition.xyz, mvPosition.xyz);
  vDist = min(.15, vDist);

  gl_Position = projectionMatrix * mvPosition;
}