uniform sampler2D positionTexture;
attribute vec2 color;

void main() {
  vec4 currentPosition = vec4(texture2D(positionTexture, color.xy));

  // node index stored in w component (0.0 is root)
  if (currentPosition.w == 0.0) {
    currentPosition.xyz = vec3(0.);
  }

  currentPosition.w = 1.0;

  vec4 mvPosition = modelViewMatrix * currentPosition;
  gl_Position = projectionMatrix * mvPosition;
}