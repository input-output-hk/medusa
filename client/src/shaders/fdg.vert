uniform sampler2D positionTexture;
uniform int pull;
attribute vec4 location;

varying vec3 vForce;

void main() {
  vec3 pos1 = texture2D(positionTexture, location.rg).xyz;
  vec3 pos2 = texture2D(positionTexture, location.ba).xyz;

  gl_PointSize = 1.;

  // pull
  if (pull == 1) {
    vec3 dist = (pos2 - pos1);
    vForce = dist * 0.01;
    gl_Position = vec4(location.r * 2. - 1., location.g * 2. - 1., 0., 1.);

  // push
  } else {
    vec3 dist = (pos1 - pos2);
    vForce = dist * 0.005;
    gl_Position = vec4(location.b * 2. - 1., location.a * 2. - 1., 0., 1.);
  }
}