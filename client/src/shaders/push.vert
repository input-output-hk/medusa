uniform sampler2D positionTexture;

attribute vec4 texLocation;

varying vec3 vForce;

void main() {
  vec3 pos1 = texture2D(positionTexture, texLocation.xy).xyz;
  vec3 pos2 = texture2D(positionTexture, texLocation.zw).xyz;

  gl_PointSize = 1.;

  vec3 dist = (pos1 - pos2);
  vForce = dist * 0.005;
  gl_Position = vec4(texLocation.z * 2. - 1., texLocation.w * 2. - 1., 0., 1.);
}