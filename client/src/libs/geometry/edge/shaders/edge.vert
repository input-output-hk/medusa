uniform sampler2D positionTexture;
attribute vec2 color;

void main() {
  vec4 currentPosition = vec4(texture2D(positionTexture, color.xy).xyz, 1.);
  vec4 mvPosition = modelViewMatrix * currentPosition;
  gl_Position = projectionMatrix * mvPosition;
}